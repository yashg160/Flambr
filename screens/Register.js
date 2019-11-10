import React, { Component } from 'react';
import { Text, View, ActivityIndicator, TextInput, ToastAndroid } from 'react-native';
import { Header, Button } from 'react-native-elements';
import * as Colors from '../assets/Colors';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import CountryPicker from 'react-native-country-picker-modal';
import { Actions } from 'react-native-router-flux';
import AsyncStorage from '@react-native-community/async-storage';

export default class Register extends Component {
    TAG = 'Register Screen:';

    constructor() {
        super();
        this.state = {
            cca2: 'IN',
            callingCode: '91',
            phoneNumber: '',
            loading: false,
            errorMessage: 'UNKNOWN_ERROR'
        }
    }

    async checkInternet() {
        await NetInfo.fetch()
            .then(status => {
                if (!status.isConnected) {
                    this.setState({ errorMessage: 'ERR_NO_INTERNET'});
                    throw Error();
                }
            });
    }

    async verifyPhoneNumber() {
        console.log(this.TAG, 'verifyPhoneNumber called');
        var { phoneNumber } = this.state;

        var reg = new RegExp('^\\d+$');

        if (reg.test(phoneNumber)) {
            //Here handle the case if the entered phone number is correct. 
            return;
        }
        else {
            this.setState({ errorMessage: 'ERR_INVALID_NUMBER' });
            throw Error();
        }
    }

    async firebaseAuthenticateNumber() {
        // In this function, we start the verification process. This always results in manual input of code by the user.
        // There is no auto detection of verification code

        //Create the number to be verified
        var { phoneNumber, callingCode } = this.state;
        var numberToVerify = `+${callingCode}${phoneNumber}`;

        auth().signInWithPhoneNumber(numberToVerify, true)
            .then(confirmationResult => {
                
                //The code has been sent to the entered phone number. Proceed to verify the input code
                auth().onAuthStateChanged(user => {
                    if (user) {
                        this.setState({ loading: false });
                        AsyncStorage.setItem('PHONE_NUMBER', numberToVerify);
                        ToastAndroid.show('Auto verified', ToastAndroid.LONG);
                        Actions.replace('pinRegister');
                    }
                    else {
                        this.setState({ loading: false });
                        ToastAndroid.show('Code sent', ToastAndroid.SHORT);
                        Actions.push('registerCode', { confirmationResult: confirmationResult, numberToVerify: numberToVerify });
                    }
                });
            })
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ loading: false });
        })
        
    }

    handleVerifyPhoneNumber() {

        //First set the button and textInput disabled to prevent multiple clicks
        this.setState({ loading: true });

        this.checkInternet()
            .then(() => this.verifyPhoneNumber())
            .then(() => this.firebaseAuthenticateNumber())
            .then(() => console.log(this.TAG, 'Authentication resolved'))
            .catch(error => {
                this.setState({ loading: false});
                if (this.state.errorMessage == 'ERR_NO_INTERNET')
                    ToastAndroid.show('No internet connection', ToastAndroid.LONG);
                else if (this.state.errorMessage == 'ERR_INVALID_NUMBER')
                    ToastAndroid.show('Phone number is wrong', ToastAndroid.LONG);
                else if (this.state.errorMessage == 'ERR_AUTH')
                    ToastAndroid.show('Error in communicating with the server', ToastAndroid.LONG);
                else {
                    console.log(this.TAG, error);
                    ToastAndroid.show('An error occurred', ToastAndroid.LONG);
                }

            });

    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <Header
                    placement='center'
                    centerComponent={{ text: 'Register', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                    containerStyle={{ backgroundColor: Colors.headerGrey }}
                    leftComponent={<Icon name='chevron-left' color={Colors.primary} size={36} onPress={() => {
                        if (!this.state.loading)
                            Actions.pop()
                    }} />} />

                <View style={{ flex: 1, alignItems: 'center', flexDirection: 'column', padding: 40 }}>
                    
                    <Text style={{ marginTop: 32, fontFamily: 'comfortaa.regular', color: 'black', alignItems: 'center', justifyContent: 'flex-start', fontSize: 16 }}>Please enter your phone number</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                        <CountryPicker
                            onSelect={(country) => {
                                this.setState({ cca2: country.cca2, callingCode: country.callingCode })
                            }}
                            withFlag={true}
                            withCloseButton={true}
                            withCallingCode={true}
                            withFilter={true}
                            callingCode={this.state.callingCode}
                            countryCode={this.state.cca2}
                            disabled={this.state.loading}
                        />

                        <Text style={{ fontSize: 18, fontFamily: 'comfortaa.regular', color: 'black' }}>+{this.state.callingCode}</Text>

                        <TextInput
                            onChangeText={phoneNumber => this.setState({ phoneNumber })}
                            value={this.state.phoneNumber}
                            placeholder='Phone Number'
                            style={{
                                marginLeft: 16,
                                fontSize: 18,
                                color: '#000',
                                textAlignVertical: 'center',
                                fontFamily: 'comfortaa.regular',
                                width: '50%'
                            }}
                            editable={!this.state.loading}
                            keyboardType='numeric' />
                    </View>

                    <Text style={{ fontSize: 14, fontFamily: 'Robot0-Black' }}>Click on the flag to change your country</Text>

                    <Button
                        title='Verify'
                        onPress={() => this.handleVerifyPhoneNumber()}
                        type='solid'
                        titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                        containerStyle={{ width: '80%' }}
                        buttonStyle={{ borderRadius: 60, marginBottom: 10, marginTop: 40, backgroundColor: Colors.primary }}
                        disabled={this.state.loading}
                        disabledStyle={{ backgroundColor: 'grey' }} />

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