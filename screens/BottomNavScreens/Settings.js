import React, { Component } from 'react';
import { View, ToastAndroid, Alert, Share } from 'react-native';
import { ListItem, Header, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-community/async-storage';
import * as Colors from '../../assets/Colors';
import { Actions } from 'react-native-router-flux';

export default class ChatPeople extends Component {

    TAG = 'Settings Screen: ';

    async getPremiumFlag() {
        try {
            const isPremium = await AsyncStorage.getItem('IS_PREMIUM');
            if (isPremium == null || isPremium == 'false')
                return false;
            else
                return true;
        }
        catch (error) {
            throw Error()
        }
    }

    handleGetPremium() {
        this.getPremiumFlag()
            .then((isPremium) => {
                if (isPremium)
                    ToastAndroid.show('You are already a premium user', ToastAndroid.LONG);
                else
                    Actions.push('payment');
            })
            .catch(error => console.log(this.TAG, error));
    }

    handleSignOutClick() {
        Alert.alert(
            'Flambr',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'No',
                    onPress: () => console.log(this.TAG, 'No Pressed'),
                    style: { fontFamily: 'comfortaa.regular', fontSize: 18, backgroundColor: 'blue' }
                },
                {
                    text: 'Yes',
                    onPress: () => this.handleSignOut(),
                    style: { fontFamily: 'comfortaa.regular', fontSize: 18, }
                }
            ],
            { cancelable: true }
        )
    }


    async handleShare() {
        try {
            const result = await Share.share({
                title: 'Flambr Dating App',
                message: 'Hey! Check out this new dating app Flambr. Its awesome! Join now!'
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log(this.TAG, 'Shared with activity tye of result.activityType');
                    ToastAndroid.show('Thanks for sharing!', ToastAndroid.SHORT);
                } else {
                    console.log(this.TAG, 'Shared the app');
                    ToastAndroid.show('Thanks for sharing!', ToastAndroid.SHORT);
                }
            } else if (result.action === Share.dismissedAction) {
                console.log(this.TAG, 'Dismissed share');
                ToastAndroid.show('Share to spread the word. Its more fun with more people', ToastAndroid.SHORT);
            }
        }
        catch (error) {
            return new Error(error);
        }
    }

    handleSharePress() {
        this.handleShare()
            .then(() => console.log(this.TAG, 'Shared feature done'))
            .catch(error => console.log(this.TAG, error));
    }

    render() {
        return (
            <View>
                <Header
                    placement='center'
                    leftComponent={{ text: 'Settings', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                    leftContainerStyle={{ flex: 1, padding: 10 }}
                    containerStyle={{ backgroundColor: Colors.headerGrey }}
                    centerContainerStyle={{ flex: 0, height: 0, width: 0 }}
                    rightContainerStyle={{ flex: 0, width: 0, height: 0 }} />

                <ListItem
                    title='Get Premium'
                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5, marginLeft: 10 }}
                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                    onPress={() => ToastAndroid.show('Coming Soon!', ToastAndroid.SHORT)} />

                <ListItem
                    title='Share With Friends'
                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5, marginLeft: 10 }}
                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                    onPress={() => this.handleSharePress()} />

                <ListItem
                    title='Edit Profile'
                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5, marginLeft: 10 }}
                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                    onPress={() => Actions.push('editProfile')}
                />

                <Divider style={{ backgroundColor: Colors.primary, width: '100%', height: 2 }} />


                <ListItem
                    title='From The Developers'
                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5, marginLeft: 10 }}
                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                    onPress={() => ToastAndroid.show('Coming Soon!!', ToastAndroid.LONG)} />

                <ListItem
                    title='Request A Feature'
                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5, marginLeft: 10 }}
                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                    onPress={() => ToastAndroid.show('Coming Soon!!', ToastAndroid.LONG)} />

                <Divider style={{ backgroundColor: Colors.primary, width: '100%', height: 2 }} />
                
            </View>
        );
    }
}