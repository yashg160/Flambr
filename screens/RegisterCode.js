import React, { Component } from 'react';
import { View, Text, ToastAndroid, TextInput, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-community/async-storage';
import { Header, Button } from 'react-native-elements';
import * as Colors from '../assets/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Actions } from 'react-native-router-flux';

export default class RegisterCode extends Component {
    constructor() {
        super();
        this.state = {
            inputCode: '',
            loading: false,
            errorMessage: 'UNKNOWN_ERROR'
        }
    }
    TAG = 'Register Screen: ';

    async verifyCode() {
        this.setState({ loading: true });

        const { confirmationResult, numberToVerify } = this.props;
        const { inputCode } = this.state;

        await confirmationResult.confirm(inputCode)
            .then(user => {
                //Successfully authenticated. Proceed to profile setup. First set up the security pin.
                console.log(this.TAG, user);
                this.setState({ loading: false }); 4
                ToastAndroid.show('Code correct', ToastAndroid.SHORT);
                AsyncStorage.setItem('PHONE_NUMBER', numberToVerify);
                Actions.replace('pinRegister');
                
            })
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ loading: false });
                ToastAndroid.show('Incorrect code', ToastAndroid.LONG);
            })
    }

    render() {
        return (
            <View style={{ flex: 1 }}>

                <Header
                    placement='center'
                    centerComponent={{ text: 'Verification', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                    containerStyle={{ backgroundColor: Colors.headerGrey }}
                    leftComponent={<Icon name='chevron-left' color={Colors.primary} size={36} onPress={() => { 
                        if (!this.state.loading)
                            Actions.pop()
                    }} />} />

                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 40 }}>

                    <Text style={{ fontSize: 22, fontFamily: 'comfortaa.regular', color: 'black', marginBottom: 20, textAlign: 'center' }}>Enter your verification code</Text>

                    <TextInput
                        onChangeText={inputCode => this.setState({ inputCode })}
                        placeholder='CODE'
                        style={{
                            fontSize: 22,
                            color: '#000',
                            textAlignVertical: 'center',
                            fontFamily: 'comfortaa.regular',
                            letterSpacing: 4,
                            textAlign: 'center',
                            width: '80%'
                        }}
                        editable={!this.state.loading}
                        keyboardType='numeric'/>

                    <Button
                        title='Verify'
                        onPress={() => this.verifyCode()}
                        type='solid'
                        titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                        containerStyle={{ width: '80%' }}
                        buttonStyle={{ borderRadius: 60, marginVertical: 20, backgroundColor: Colors.primary }}
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