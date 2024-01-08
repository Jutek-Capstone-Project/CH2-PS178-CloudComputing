from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import load_model 
from sklearn.metrics import silhouette_score
from io import BytesIO
from google.cloud import storage
import gcsfs
from math import cos, asin, sqrt, pi, sin, radians, atan2
from tensorflow.python.lib.io import file_io
import json
import os 

app = Flask(__name__)

storage_client = storage.Client()
bucket = storage_client.get_bucket('streamlit-bucket9801')

def jenis_lapangan(df, input_field):
    if input_field == 'semua':
        df_semua = df
        return df_semua
    elif input_field == 'sepak bola':
        df_sepakbola = df[df['jenis_sepakbola'] == 1]
        return df_sepakbola
    elif input_field == 'voli':
        df_voli = df[df['jenis_voli'] == 1]
        return df_voli
    elif input_field == 'futsal':
        df_futsal = df[df['jenis_futsal'] == 1]
        return df_futsal
    elif input_field == 'badminton':
        df_badminton = df[df['jenis_badminton'] == 1]
        return df_badminton
    elif input_field == 'lainnya':
        df_basket = df[df['jenis_basket'] == 1]
        df_tenis = df[df['jenis_tenis'] == 1]
        df_lainnya = pd.concat([df_basket, df_tenis], axis=0)
        return df_lainnya
    else:
        return "There is nothing"

def distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # kilometer

    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c

    return distance

# Extract recommendations based on a given location
def recommend_location_neural_network(df, model, scaler, lng, lat):
    # Standardize the input coordinates
    input_coordinates = np.array([[lng, lat]])
    input_coordinates = scaler.transform(input_coordinates)

    # Predict the cluster using the neural network model
    predicted_cluster = np.argmax(model.predict(input_coordinates))

    # Filter the dataframe based on the predicted cluster
    cluster_df = df[df['cluster'] == predicted_cluster].copy()

    # Sort the dataframe based on distance (you may use your own distance function here)
    cluster_df['distance'] = cluster_df.apply(lambda x: distance(lat, lng, x['lat'], x['lng']), axis=1)
    sorted_df = cluster_df.sort_values(by=['distance'])

    # Return the top 10 recommendations
    recommendations = sorted_df.iloc[0:10][['name', 'lng', 'lat', 'distance']]
    
    # If the reccomendations less than 10 fields
    if len(recommendations) < 10:
        additional_recommendations = df[df['cluster'] != predicted_cluster].copy()
        additional_recommendations['distance'] = additional_recommendations.apply(lambda x: distance(lat, lng, x['lat'], x['lng']), axis=1)
        sorted_additional = additional_recommendations.sort_values(by=['distance'])

        additional_recommendations = sorted_additional.iloc[0:(8 - len(recommendations))][['name', 'lng', 'lat', 'distance']]

        recommendations = pd.concat([recommendations, additional_recommendations])

    return recommendations

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()

    df = pd.read_csv('gs://streamlit-bucket9801/Data Lapangan (2).csv')
    lng = float(data['lng'])
    lat = float(data['lat'])
    input_field = data['input_field']
    
    scaler = StandardScaler()
    coordinates = df[['lng', 'lat']]
    X = coordinates.values
    X = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=4, init='k-means++', random_state=42)
    df['cluster'] = kmeans.fit_predict(coordinates)
    
    model = load_model('gs://streamlit-bucket9801/new-user-location (2).h5')
    lapangan_df = jenis_lapangan(df, input_field)
    
    
    recommendations = recommend_location_neural_network(lapangan_df, model, scaler, lng, lat)

    output = recommendations.to_dict(orient='records')
    json_output = json.dumps(output, indent=4)

    return jsonify(json.loads(json_output))

@app.route('/recommend-similar-field', methods=['POST'])
def recommend_similar_field():
    data = request.get_json()
    current_lng = float(data['lng'])
    current_lat = float(data['lat'])
    input_field = data['input_field']

    field_dataset = pd.read_csv('gs://streamlit-bucket9801/Data Lapangan (2).csv')

    row_condition = field_dataset['id'] == input_field
    row_index = field_dataset.index[row_condition][0]
    columns_with_1 = field_dataset.iloc[row_index, 1:] == 1

    columns = ['jenis_sepakbola', 'jenis_badminton', 'jenis_tenis', 'jenis_futsal', 'jenis_voli', 'jenis_basket']
    for i in columns:
        if columns_with_1[i]:
            jenis = i
            break

    pca_field = field_dataset[['lat', 'lng', 'rating', 'price', jenis,
                               'fasilitas_wifi', 'fasilitas_parkir_motor', 'fasilitas_parkir_mobil',
                               'fasilitas_wc', 'fasilitas_kantin', 'fasilitas_mushola']]

    pca_field = pca_field[pca_field[jenis] == 1]

    # Standardize the data
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(pca_field), columns=pca_field.columns, index=pca_field.index)


    autoencoder = load_model('gs://streamlit-bucket9801/pca-autoencoder.h5')
    encoded_data = autoencoder.predict(X_scaled)
    X_pca_tensor = tf.convert_to_tensor(encoded_data, dtype=tf.float32)


    # KMeans clustering
    n_clusters = 4
    initial_clusters = tf.random.shuffle(X_pca_tensor)[:n_clusters]
    kmeans = tf.compat.v1.estimator.experimental.KMeans(num_clusters=n_clusters, use_mini_batch=False, seed = 0)

    def input_fn():
        return tf.compat.v1.train.limit_epochs(tf.convert_to_tensor(encoded_data, dtype=tf.float32), num_epochs=1)

    previousCenters = initial_clusters
    for _ in range(2):
        kmeans.train(input_fn)
        clusterCenters = kmeans.cluster_centers()
        previousCenters = clusterCenters

    clusterCenters = kmeans.cluster_centers()
    clusterLabels = list(kmeans.predict_cluster_index(input_fn))

    pca_field['cluster'] = clusterLabels
    cluster = pca_field.iloc[row_index]['cluster']

    rec_index = pca_field.index[pca_field['cluster'] == cluster].tolist()
    list_recommend = field_dataset.iloc[rec_index]

    list_recommend['dist'] = list_recommend.apply(lambda x: distance(current_lat, current_lng, x['lat'], x['lng']), axis=1)

    shortest_distance = list_recommend.sort_values(by=['dist'], ascending=True).iloc[0:10]

    output = shortest_distance.to_dict(orient='records')
    json_output = json.dumps(output, indent = 4)

    print(json_output)
    return json.loads(json_output)


if __name__ == "__main__":
    app.run(debug=True)