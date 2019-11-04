import React, { Component } from 'react';
import { View, Text, ToastAndroid, TextInput, ActivityIndicator, BackHandler } from 'react-native';
import { Button, Header, Icon } from 'react-native-elements';
import { Actions } from 'react-native-router-flux';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Colors from '../assets/Colors';

export default class Pin extends Component {

    constructor(props) {
        super(props);
        this.state = {
            pin: null,
            partialPath: null,
            errorMessage: 'ERR_UNKNOWN',
            loading: false
        }
    }

    TAG = 'PinSignIn:';
    
    async checkInternet() {
        await NetInfo.fetch()
            .then(status => {
                if (!status.isConnected) {
                    this.setState({ errorMessage: 'ERR_NO_INTERNET' });
                    throw Error();
                }
            });
    }

    async checkPin() {
        if (this.state.pin == null) {
            this.setState({ errorMessage: 'ERR_NULL_PIN' });
            throw Error();
        }   
        else if (this.state.pin.length < 5) {
            this.setState({ errorMessage: 'ERR_PIN_LENGTH_INVALID' });
            throw Error();
        }
    }

    async verifyPin() {
        const { phoneNumber } = this.props;
        const { pin } = this.state;

        const ref = `all_users/${phoneNumber}`;

        var snapshot = await firestore().doc(ref).get();
        var storedPin = snapshot.get('pin');

        if (pin != storedPin) {
            this.setState({ errorMessage: 'ERR_INCORRECT_PIN' });
            throw Error();
        }
        else {
            AsyncStorage.setItem('PIN', pin);
            var partialPath = snapshot.get('path_to_document');

            this.getDataFromProfile(partialPath);
        }
    }

    getDataFromProfile(partialPath) {
        console.log(this.TAG, 'Called getDataFromProfile');

        const { phoneNumber } = this.props;
        const userDocRef = partialPath + '/' + phoneNumber;

        AsyncStorage.setItem('USER_DOC_REF', userDocRef);
        AsyncStorage.setItem('PHONE_NUMBER', phoneNumber);

        console.log(this.TAG, userDocRef);

        firestore().doc(userDocRef).get()
            .then(docSnapshot => {
                console.log(this.TAG, 'Got document snapshot', docSnapshot);
                const avatar_url = docSnapshot.get('avatar_url');
                const preference = docSnapshot.get('preference');
                const name = docSnapshot.get('name');
                const userDocRef = docSnapshot.get('path_to_document');

                AsyncStorage.setItem('AVATAR_URL', avatar_url);
                AsyncStorage.setItem('USER_NAME', name);
                AsyncStorage.setItem('USER_PREF', preference);
                AsyncStorage.setItem('USER_DOC_REF', userDocRef);

                this.setState({ loading: false });

                Actions.replace('bottomNavigator');
            })
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ errorMessage: 'ERR_DOCUMENT', loading: false });
                ToastAndroid.show('An error occurred', ToastAndroid.LONG);
            });
    }

    handleSignIn() {
        console.log(this.TAG, 'Called handleSignIn');

        this.setState({ loading: true });

        this.checkInternet()
            .then(() => this.checkPin())
            .then(() => this.verifyPin())
            .catch(error => {
                this.setState({ loading: false });
                console.log(this.TAG, error);

                const { errorMessage } = this.state;
                if (errorMessage == 'ERR_UNKNOWN')
                    ToastAndroid.show('An unknown error occurred', ToastAndroid.LONG);
                else if (errorMessage == 'ERR_NO_INTERNET')
                    ToastAndroid.show('No internet connection', ToastAndroid.SHORT);
                else if (errorMessage == 'ERR_NULL_PIN')
                    ToastAndroid.show('Pin is empty', ToastAndroid.LONG);
                else if (errorMessage == 'ERR_PIN_LENGTH_INVALID')
                    ToastAndroid.show('Pin length has to be 5', ToastAndroid.LONG);
                else if (errorMessage == 'ERR_INCORRECT_PIN')
                    ToastAndroid.show('Pin entered is incorrect', ToastAndroid.LONG);
                else
                    ToastAndroid.show('An error occurred', ToastAndroid.LONG);
            });
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <Header
                    placement='center'
                    centerComponent={{ text: 'Security', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                    containerStyle={{ backgroundColor: Colors.headerGrey }}
                    leftComponent={
                        <Icon
                            name='chevron-left'
                            color={Colors.primary}
                            size={36}
                            onPress={() => Actions.pop()}
                        />
                    }
                />

                <View style={{ flex: 1, alignItems: 'center', flexDirection: 'column', padding: 40 }}>

                    <Text style={{
                        fontSize: 20, 
                        color: 'black',
                        fontFamily: 'comfortaa.regular',
                        textAlign: 'center'
                    }}>
                        Enter your security PIN
                    </Text>

                    <TextInput
                        onChangeText={(pin) => this.setState({ pin })}
                        value={this.state.pin}
                        placeholder='PIN'
                        style={{
                            fontSize: 28,
                            color: '#000',
                            textAlignVertical: 'center',
                            textAlign: 'center',
                            fontFamily: 'comfortaa.regular',
                            letterSpacing: 4,
                            width: '80%',
                            marginTop: 20
                        }}
                        editable={!this.state.loading}
                        keyboardType='numeric' 
                        maxLength={5}
                    />

                    <Text style={{
                        fontSize: 18,
                        color: 'black',
                        fontFamily: 'comfortaa.regular',
                        textAlign: 'center'
                    }}>
                        You set this PIN up when you registered with us.
                    </Text>

                    <Button
                        title='Verify'
                        onPress={() => this.handleSignIn()}
                        type='solid'
                        titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                        containerStyle={{ width: '80%' }}
                        buttonStyle={{ borderRadius: 60, marginBottom: 10, marginTop: 20, backgroundColor: Colors.primary }}
                        disabled={this.state.loading}
                        disabledStyle={{ backgroundColor: 'grey' }}
                    />

                    <ActivityIndicator
                        size='large'
                        animating={this.state.loading}
                        style={{
                            marginTop: 20,
                        }}
                        color={Colors.primary} />

                </View>
            </View>
        )
    }
}