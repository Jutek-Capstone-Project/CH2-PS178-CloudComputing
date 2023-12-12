import tfn from '@tensorflow/tfjs-node';
import tf from '@tensorflow/tfjs';
import { sin, cos, sqrt, atan2 } from 'mathjs';
import csv from 'csv-parser'; 
import fs, {readFileSync} from 'fs';

export const csvContent = '/Users/whs9801/CH2-PS178-CloudComputing/dataset/Data Lapangan.csv';

export const jenis_lapangan = (input_field, results) => {
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

export const distance = (lat1, lon1, lat2, lon2) => {
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

export const indexOfMax = (arr) => {
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


