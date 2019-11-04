import React, { Component } from 'react';
import { Text, View, ActivityIndicator, TextInput, ToastAndroid, Alert } from 'react-native';
import { Header, Button } from 'react-native-elements';
import * as Colors from '../assets/Colors';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CountryPicker from 'react-native-country-picker-modal';
import { Actions } from 'react-native-router-flux';

export default class SignIn extends Component {
    TAG = 'SignIn Screen:';

    constructor() {
        super();
        this.state = {
            cca2: 'IN',
            callingCode: '91',
            phoneNumber: null,
            errorMessage: 'ERR_UNKNOWN',
            loading: false
        }
    }

    handleSignInPress() {
        var { callingCode, phoneNumber } = this.state;

        if (phoneNumber == null) {
            this.setState({ loading: false });
            ToastAndroid.show('Phone number is empty', ToastAndroid.LONG);
            return;
        }
        else {
            var number = `+${callingCode}${phoneNumber}`;

            Actions.push('pinSignIn', { phoneNumber: number });
        }
        
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <Header
                    placement='center'
                    centerComponent={{ text: 'Sign In', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
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
                        title='Proceed'
                        onPress={() => this.handleSignInPress()}
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