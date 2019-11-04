import { Text, View, ActivityIndicator, ImageBackground, Dimensions, ToastAndroid } from 'react-native';
import React, { Component } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import { Button } from 'react-native-elements';
import { Actions } from 'react-native-router-flux';
import * as Colors from '../assets/Colors';

export default class Home extends Component {
    TAG = 'Home Screen:';
    HEIGHT = Dimensions.get('window').height;
    WIDTH = Dimensions.get('window').width;

    constructor() {
        super();

        this.state = {
            isSignedIn: null,
            loading: true,
            error: false
        }
    }

    async getSignedIn() {
        console.log(this.TAG, 'getSignedIn called');
        const isSignedIn = await AsyncStorage.getItem('IS_SIGNED_IN');
        if (isSignedIn == 'true')
            this.setState({ isSignedIn: true });
        else
            this.setState({ isSignedIn: false });
    }

    componentDidMount() {
        this.getSignedIn()
            .then(() => this.setState({ loading: false, error: false }))
            .catch(error => {
                console.log(this.TAG, 'Error occurred', error);
                this.setState({ loading: false, error: true })
            });
    }

    render() {
        
        if (this.state.loading) {
            return (
                <ActivityIndicator size='large' style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} color={Colors.primary} />
            )
        }

        else { 
            if (this.state.error)
                ToastAndroid.show('An error occurred', ToastAndroid.SHORT);
            
            if (this.state.isSignedIn) {
                //Case where profile is complete and user is signed in. Navigate to the main screen
                //TODO: Replace main with bottomNavigator
                Actions.replace('bottomNavigator');
                return (<View />)
            }

            else {
                return (
                    <ImageBackground source={require('../assets/home_bg.jpg')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', paddingHorizontal: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

                            <Text style={{ fontSize: 38, textShadowColor: 'white', textShadowRadius: 10, fontFamily: 'comfortaa.regular', color: 'white', marginBottom: 5 }}>flambr</Text>

                            <Text style={{ fontSize: 20, textShadowColor: 'white', textShadowRadius: 5, fontFamily: 'comfortaa.regular', color: 'white', marginTop: 5, textAlign: 'center' }}>Make the swipe. You will be glad you did</Text>

                            <Button
                                title='Register'
                                onPress={() => Actions.push('register')}
                                type='solid'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                                containerStyle={{ width: '80%' }}
                                buttonStyle={{ borderRadius: 60, marginTop: 60, backgroundColor: Colors.primary, zIndex: 100 }} />

                            <Button
                                title='Sign In'
                                onPress={() => Actions.push('signIn')}
                                type='outline'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                                containerStyle={{ width: '80%' }}
                                buttonStyle={{ borderRadius: 60, borderWidth: 1, marginTop: 20, borderColor: Colors.primary, zIndex: 100 }} />


                            <Text style={{ fontSize: 20, textShadowColor: 'white', textShadowRadius: 5, fontFamily: 'comfortaa.regular', color: 'white', marginTop: 20, textAlign: 'center' }}>If you already have an account, sign in.</Text>

                            <Text style={{ fontSize: 14, color: 'white', marginTop: 20, textAlign: 'center' }}>Picture by Chris Fuller on <Text style={{ color: Colors.mayaBlue }}>Unsplash</Text></Text>
                        </View>
                    </ImageBackground>
                )
            }
        }
    }
}