import { Router } from 'express';
import { body, header } from 'express-validator';
import controller, { validate, fetchUserByEmailOrID } from './controller.js';
import express from 'express';
import csv from 'csv-parser';
import fs from 'fs';
import DB from './dbConnection.js';
import Stripe from 'stripe';
import admin from 'firebase-admin';


const routes = Router({ strict: true });
const fileName = '/Users/whs9801/CH2-PS178-CloudComputing/nodejs-mysql-auth-api/arena.csv'
const serviceAccount = require('./serviceAccountKey.json');
const stripe = Stripe('sk_test_51OLggCDVadqvWMEH2xy5NwCb0ViTaYZ2FRKBF4axp8lNZnlSH7PQsRMnLyC1u1O5Bg8XUtEG4FAYRCCxyw0zlaLm00J9fBHnqE');
const firebaseAdmin = admin.initializeApp({
    credential: serviceAccount,
});

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
    //var parser = csv({columns: true}, function (err, records) {
        //console.log(records);
    //});

    //fs.createReadStream(fileName).pipe(parser);

    const results = [];
    fs.createReadStream(fileName)
        .pipe(csv())
        .on('data', (data) => results.push(data))
       .on('end', () => {
            res.json(results);
        });
})

routes.get('/data/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const results = [];
    fs.createReadStream(fileName)
        .pipe(csv())
        .on('data', (row) => {
            if (row.id === id) {
                results.push(row);
            }
        })
        .on('end', () => {
            res.json(results);
        })
    });

routes.get('/data/column/:columnName/:columnValue?', (req, res) => {
    const columnName = req.params.columnName;
    const columnValue = req.params.columnValue;
    const result = [];
  
    fs.createReadStream(fileName)
      .pipe(csv())
      .on('data', (row) => {
        if (!columnValue || row[columnName] === columnValue) {
          result.push(row);
        }
      })
      .on('end', () => {
        res.json(result);
      }); 
    })

routes.get('/dbdata', async (req, res) => {
try{
    const [result] = await DB.execute('SELECT * FROM `users`');
    res.json(result)
}
catch(err){
    console.log(err)
}
});

routes.post('/process-payment', async(req, res) => {
    const { amount, currency, token } = req.body;

    try {
        // Create a payment intent using the Stripe API
        const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: token,
        confirm: true,
        });

        // Return the payment intent status to the client
        res.json({ status: paymentIntent.status });

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the payment.' });
    }
});

routes.post('/payment', function(req, res){
 
    // Moreover you can take more details from user
    // like Address, Name, etc from form
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: 'Gourav Hammad',
        address: {
            line1: 'TC 9/4 Old MES colony',
            postal_code: '452331',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
        }
    })
    .then((customer) => {
 
        return stripe.charges.create({
            amount: 2500,     // Charging Rs 25
            description: 'Web Development Product',
            currency: 'INR',
            customer: customer.id
        });
    })
    .then((charge) => {
        res.send("Success")  // If no error occurs
    })
    .catch((err) => {
        res.send(err)       // If some error occurs
    });
})

routes.post('/notification', async (devicePushToken, title, body) => {
    await firebaseAdmin.messaging().send({
        token: devicePushToken,
        notification: {
            title: title,
            body: body,
        },
    })
})

export default routes;
