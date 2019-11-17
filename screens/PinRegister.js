import React, { Component } from 'react';
import { View, Text, ToastAndroid, TextInput, BackHandler } from 'react-native';
import { Button, Header, Icon } from 'react-native-elements';
import { Actions } from 'react-native-router-flux';
import * as Colors from '../assets/Colors';

export default class Pin extends Component{

    constructor(props) {
        super(props);
        this.state = {
            pin: ''
        }
    }

    TAG = 'PinRegisterPress:'

    async handleProceedPress() {
        console.log(this.TAG, 'Called handleProceedPress');

        //Check that the length of PIN is 5 and that it is not empty
        const { pin } = this.state;

        if (pin.length < 5) {
            ToastAndroid.show('Enter a 5 digit PIN', ToastAndroid.LONG);
            return;
        }
        else if (pin == '') {
            ToastAndroid.show('Pin cannot be empty', ToastAndroid.LONG);
            return;
        }
        else {
            Actions.push('profileSetup', { pin: this.state.pin });
        }
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
                            onPress={() => BackHandler.exitApp()}
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
                        keyboardType='numeric'
                        maxLength={5}
                    />

                    <Text style={{
                        fontSize: 20,
                        color: 'black',
                        fontFamily: 'comfortaa.bold',
                        textAlign: 'center'
                    }}>
                        Remember this!
                    </Text>

                    <Text style={{
                        fontSize: 18,
                        color: 'black',
                        fontFamily: 'comfortaa.regular',
                        textAlign: 'center'
                    }}>
                        You will use this pin to sign in.
                    </Text>

                    <Button
                        title='Proceed'
                        onPress={() => this.handleProceedPress()}
                        type='solid'
                        titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                        containerStyle={{ width: '80%' }}
                        buttonStyle={{ borderRadius: 60, marginBottom: 10, marginTop: 20, backgroundColor: Colors.primary }}
                        disabledStyle={{ backgroundColor: 'grey' }}
                    />

                </View>
            </View>
        )
    }
}