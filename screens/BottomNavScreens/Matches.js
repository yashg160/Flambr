import React, { Component } from 'react';
import { View, Text } from 'react-native';

export default class Matches extends Component {
    render() {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40}}>
                <Text style={{ fontSize: 26, color: 'black', fontFamily: 'comfortaa.bold', marginBottom: 20 }}>Coming Soon!</Text>
                <Text style={{ fontSize: 18, color: 'black', fontFamily: 'comfortaa.regular', textAlign: 'center'}}>Here you will view all the people that have right swiped you</Text>
            </View>
        )
    }
}