import { readFile } from 'fs/promises';
import path from 'path';
import tfn from '@tensorflow/tfjs-node';
import tf from '@tensorflow/tfjs';
import { KMeans } from './node_modules/machinelearn/cluster/index.js';
import { MinMaxScaler } from './node_modules/machinelearn/preprocessing/index.js';
import { train_test_split } from './node_modules/machinelearn/model_selection/index.js';
import { sin, cos, sqrt, atan2 } from 'mathjs';
import csv from 'csv-parser'; 
import fs, {readFileSync} from 'fs';
import kmeans from 'node-kmeans';
import radians from 'degrees-radians';

const csvContent = '/Users/whs9801/CH2-PS178-CloudComputing/dataset/Data Lapangan.csv';

function read(filePath, longitude, latitude, input_field){
    const results = [];

    fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {results.push(data);})

    .on('end', () => {
      const output = jenis_lapangan(input_field, results);
      homepage_recommend(output, longitude, latitude);
    }
    );
}

function jenis_lapangan(input_field, results){
    if (input_field == 'semua'){
        const df_semua = results;
        return df_semua;
    }

    else if(input_field == 'sepak bola')
    {
    const df_sepakbola = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_sepakbola == 1){
            df_sepakbola.push(results[i]);
        }
    } 
        return df_sepakbola;
    }

    else if(input_field == 'voli')
    {
    const df_voli = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_voli == 1){
            df_voli.push(results[i]);
        }
    } 
        return df_voli;
    }

    else if(input_field == 'futsal')
    {
    const df_futsal = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_futsal == 1){
            df_futsal.push(results[i]);
        }
    } 
        return df_futsal;
    }

    else if(input_field == 'badminton')
    {
    const df_badminton = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_badminton == 1){
            df_badminton.push(results[i]);
        }
    } 
        return df_badminton;
    }

    else if(input_field == 'basket')
    {
    const df_basket = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_basket == 1){
            df_basket.push(results[i]);
        }
    } 
        return df_basket;
    }

    else if(input_field == 'tenis')
    {
    const df_tenis = []; 
    for(let i=0; i<results.length; i++){
        if(results[i].jenis_tenis == 1){
            df_tenis.push(results[i]);
        }
    } 
        return df_tenis;
    }

    else{
        return 'There is nothing';
    }

}

function homepage_recommend(results, longitude, latitude){
    const X = new Array();

    for(let i=0; i<results.length; i++){
        X[i] = [results[i].lng, results[i].lat];
    }


    kmeans.clusterize(X, {k:10}, (err,res) => {
        if (err) console.error(err);
        else {
            for(let i=0; i<res.length; i++){
                console.log('%o',res[i].centroid);
            }
            const y = [];
            for(let i=0; i<818; i++){
                for(let j=0; j<10; j++){
                    for(let k=0; k<res[j].clusterInd.length; k++){
                        if(i == res[j].clusterInd[k]){
                            y.push(j);
                        }
                    }
                }
            }

            let i = 0;
            const X_train = X.filter(x => i++%5 !== 0);
            const y_train = y.filter(x => i++%5 !== 0);
            i = 0
            const X_test = X.filter(x => i++%5 === 0);
            const y_test = y.filter(x => i++%5 === 0);

            recommended_location_neural_networks(X, y, longitude, latitude)
            
            }
        });
    

    function distance(lat1, lon1, lat2, lon2){
        let R = 6371;

        function degrees_to_radians(degrees)
        {
        var pi = Math.PI;
        return degrees * (pi/180);
        }

        lat1 = degrees_to_radians(lat1);
        lat2 = degrees_to_radians(lat2);
        lon1 = degrees_to_radians(lon1);    
        lon2 = degrees_to_radians(lon2);    

        let dlat = lat2 - lat1;
        let dlon = lon2 - lon1;
        let a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        let distance = R * c

        return distance
    }

    function recommended_location_neural_networks(X, y, lng, lat){
        function indexOfMax(arr) {
            if (arr.length === 0) {
                return -1;
            }
        
            var max = arr[0];
            var maxIndex = 0;
        
            for (var i = 1; i < arr.length; i++) {
                if (arr[i] > max) {
                    maxIndex = i;
                    max = arr[i];
                }
            }
        
            return maxIndex;
        }

       async function load_model(){
            const handler = tfn.io.fileSystem('./model/new-user-location.tfjs/model.json');
            const model = await tf.loadLayersModel(handler);
            const coord = tf.tensor([[lng, lat]]);
            const predicted_cluster = indexOfMax(model.predict(coord));
            console.log(predicted_cluster);
            const cluster = []
            for(let i=0; i<y.length; i++){
                if(y[i] == predicted_cluster){
                    cluster.push(X[i]);
                }
            }

            const dist = [];
            const index = [];

            for(let i=0; i<cluster.length; i++){
              dist.push(distance(lat, lng, cluster[i][1], cluster[i][0]));
            }

            const val = dist.sort().slice(0,10);
            console.log(val)

            for(let i=0; i<val.length; i++){
              for(let j=0; j<cluster.length; j++){
                if(val[i] == distance(lat, lng, cluster[j][1], cluster[j][0])){
                  index.push(results[j]);
                }
              }
            }   

            console.log(index);
        }
        load_model();
       }
}

read(csvContent, 106.827153, -6.175392, 'semua');


