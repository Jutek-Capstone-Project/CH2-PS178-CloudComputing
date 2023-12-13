import { Router } from 'express';
import { body, header } from 'express-validator';
import controller, { validate, fetchUserByEmailOrID } from './controller.js';
import {Storage} from '@google-cloud/storage';
import express from 'express';
import csv from 'csv-parser';
import fs from 'fs';
import DB from './dbConnection.js'; 
import {jenis_lapangan, distance, indexOfMax} from './sample.js';
import {kmeans} from 'ml-kmeans';
import tfn from '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';

const bucketName = 'dataset-bucket-9801';
const fileName = 'Data Lapangan.csv';

const routes = Router({ strict: true });
const storage = new Storage();
const bucket = storage.bucket(bucketName);

const load_model = async (results, X, y, lng, lat) => {
    const handler = 'https://github.com/Jutek-Capstone-Project/CH2-PS178-Cloud_Computing/blob/branch-2/model/new-user-location.tfjs/model.json';
    const model = await tf.loadLayersModel(handler);
    const coord = tf.tensor([[lng, lat]]);
    const predicted_cluster = indexOfMax(model.predict(coord));
    console.log(predicted_cluster);
    console.log(X.length);
    console.log(y.length);
    const cluster = []
    for(let i=0; i<y.length; i++){
        if(y[i] == predicted_cluster){
            cluster.push(X[i]);
        }
    }
    console.log(cluster.length);
    const dist = [];
    const index = [];
    for(let i=0; i<cluster.length; i++){
      dist.push(distance(lat, lng, cluster[i][1], cluster[i][0]));
    }
    const val = dist.sort().slice(0,10);
    for(let i=0; i<val.length; i++){
      for(let j=0; j<cluster.length; j++){
        if(val[i] == distance(lat, lng, cluster[j][1], cluster[j][0])){
          index.push(results[j]);
        }
      }
    }   
    console.log(index.length);
    return index;
}

const homepage_recommend = (results, longitude, latitude) => {
    const X = new Array();

    for(let i=0; i<results.length; i++){
        X[i] = [results[i].lng, results[i].lat];
    }

    let centers = [[ 110.51120340789475, -7.9387781868421055],
    [110.122775775, -7.8736944675],
    [110.22179131707321, -7.90374066097561],
    [110.41456638157892, -7.708609292105262],
    [110.2922045422222, -7.773480315555553],
    [110.32779292745096, -7.940743580392157],
    [110.40239900615383, -7.835370053846154],
    [110.17963109249999, -7.749816457500001],
    [110.64924044651166, -7.905393716279071],
    [110.682575696875, -8.069387253125]]

    let out = kmeans(X, 10, { initialization: centers })
    let y = out.clusters;
    return [X,y];
}
// Token Validation Rule
const tokenValidation = (isRefresh = false) => {
    let refreshText = isRefresh ? 'Refresh' : 'Authorization';

    return [
        header('Authorization', `Please provide your ${refreshText} token`)
            .exists()
            .not()
            .isEmpty()
            .custom((value, { req }) => {
                if (!value.startsWith('Bearer') || !value.split(' ')[1]) {
                    throw new Error(`Invalid ${refreshText} token`);
                }
                if (isRefresh) {
                    req.headers.refresh_token = value.split(' ')[1];
                    return true;
                }
                req.headers.access_token = value.split(' ')[1];
                return true;
            }),
    ];
};

// Register a new User
routes.post(
    '/signup',
    [
        body('name')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Name must not be empty.')
            .isLength({ min: 3 })
            .withMessage('Name must be at least 3 characters long')
            .escape(),
        body('email', 'Invalid email address.')
            .trim()
            .isEmail()
            .custom(async (email) => {
                const isExist = await fetchUserByEmailOrID(email);
                if (isExist.length)
                    throw new Error(
                        'A user already exists with this e-mail address'
                    );
                return true;
            }),
        body('password')
            .trim()
            .isLength({ min: 4 })
            .withMessage('Password must be at least 4 characters long'),
    ],
    validate,
    controller.signup
);

// Login user through email and password
routes.post(
    '/login',
    [
        body('email', 'Invalid email address.')
            .trim()
            .isEmail()
            .custom(async (email, { req }) => {
                const isExist = await fetchUserByEmailOrID(email);
                if (isExist.length === 0)
                    throw new Error('Your email is not registered.');
                req.body.user = isExist[0];
                return true;
            }),
        body('password', 'Incorrect Password').trim().isLength({ min: 4 }),
    ],
    validate,
    controller.login
);

// Get the user data by providing the access token
routes.get('/profile', tokenValidation(), validate, controller.getUser);

// Logout user by invalidating the refresh token
routes.post('/logout', tokenValidation(true), validate, controller.logout);

// Get new access and refresh token by providing the refresh token
routes.get(
    '/refresh',
    tokenValidation(true),
    validate,
    controller.refreshToken
);

routes.get('/data', (req, res) => {
    const data = [];
  
    const file = bucket.file(fileName);
    file.createReadStream()
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        res.json(data);
      });
  });



routes.get('/dbdata', (req, res) => {
    try{
        const [result] = DB.execute('SELECT * FROM `users`');
        res.json(result)
    }
    catch(err){
        console.log(err)
    }
    });

routes.post('/model', async(req, res) => {
    try{
        let { lng, lat, input_field} = req.body;
        let results = []

        const file = bucket.file(fileName);

        file.createReadStream()
        .pipe(csv())
        .on('data', (data) => {results.push(data);})

        .on('end', async() => {
        let output = jenis_lapangan(input_field, results);
        let [x,y] = homepage_recommend(output, lng, lat);
        let final = await load_model(results, x, y, lng, lat);
        res.json(final);
        });
    }

    catch(err){
    res.status(500).json({ error: 'An error occurred .' })
    }
});
export default routes;
