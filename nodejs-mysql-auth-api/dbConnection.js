import mysql from 'mysql2';
import { config } from 'dotenv';
import {Connector} from '@google-cloud/cloud-sql-connector';

const connector = new Connector();
const clientOpts = await connector.getOptions({
  instanceConnectionName: 'silent-fuze-400506:asia-southeast2:signup-login-auth',
  ipType: 'PUBLIC',
});

const connection = () => {
    config();
    const { DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    return mysql.createPool({
        ...clientOpts,
        user: 'myinstance',
        password: 'Violalee99',
        database: 'login_signup_auth',
    });
};

export default connection().promise();