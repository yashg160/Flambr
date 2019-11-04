import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { Avatar, Icon, Button } from 'react-native-elements';
import * as Colors from '../../assets/Colors';
import { Actions } from 'react-native-router-flux';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-community/async-storage';

export default class MatchPerson extends Component {

    constructor() {
        super();
        this.state = {
            userDocRef: null,
            personRef: null,
            loading: true
        }
    }

    TAG = 'MatchPerson:';

    async getValues() {
        var userDocRef = await AsyncStorage.getItem('USER_DOC_REF');
        var personRef = await this.props.personReference;
        await this.setState({ userDocRef, personRef });
    }

    componentDidMount() {
        
        this.getValues()
            .then(() => this.setState({ loading: false }))
            .catch(error => console.log(this.TAG, error));
        
    }

    render() {
        console.log(this.TAG, this.state, this.props);

        if (this.state.loading) {
            return (
                <View/>
            )
        }

        var { userDocRef, personRef } = this.state;

        //Get this user's phone number
        const userPhoneNumber = userDocRef.split('/')[3];

        //Get the matched person's phone number
        const matchedPersonPhoneNumber = personRef.split('/')[3];

        //Set match=true in both user's liked_by_people collection for the other user
        firestore().doc(userDocRef).collection('liked_by_people').doc(matchedPersonPhoneNumber).set({
            match: true
        }, {
            merge: true
        });

        firestore().doc(personRef).collection('liked_by_people').doc(userPhoneNumber).set({
            match: true
        }, {
            merge: true
        });
        return (
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80, backgroundColor: 'rgba(0,0,0,0.8)' }}>

                <Text style={{ fontFamily: 'Balqis', fontSize: 40, color: 'white', textShadowColor: 'white', textShadowRadius: 24 }}>It's a Match!</Text>

                <Avatar
                    rounded
                    source={{ uri: this.props.avatarUrl }}
                    size='xlarge'
                    renderPlaceholderContent={<Icon name='person' type='material-icon' size={40} />}
                    containerStyle={{ marginBottom: 30, marginTop: 40, borderColor: Colors.primary, borderWidth: 8, shadowColor: Colors.primary, shadowOpacity: 1, shadowRadius: 20 }} />

                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 26, color: 'white', marginBottom: 20, textShadowColor: 'white', textShadowRadius: 20}}>{this.props.name}</Text>

                <Button
                    title='Chat'
                    onPress={() => {
                        const person = {
                            name: this.props.name,
                            phoneNumber: this.props.phoneNumber,
                            avatar_url: this.props.avatar_url
                        }
                        Actions.replace('chat', { person: person });
                    }}
                    type='solid'
                    titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 24 }}
                    containerStyle={{ width: '60%' }}
                    buttonStyle={{ borderRadius: 60, marginVertical: 10, backgroundColor: Colors.primary }} />

                <Button
                    title='Swipe'
                    onPress={() => Actions.pop()}
                    type='outline'
                    titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 24 }}
                    containerStyle={{ width: '60%' }}
                    buttonStyle={{ borderRadius: 60, marginVertical: 10, borderColor: 'white' }} />
            </View>
        )
    }
}