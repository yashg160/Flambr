import React, { Component } from 'react';
import { Text, View, ActivityIndicator, ScrollView, ToastAndroid, PermissionsAndroid } from 'react-native';
import { Header, Avatar, Icon, Input, Button } from 'react-native-elements';
import * as Colors from '../assets/Colors';
import ImagePicker from 'react-native-image-crop-picker';
import SegmentedControlTab from "react-native-segmented-control-tab";
import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-community/async-storage';
import { Actions } from 'react-native-router-flux';

export default class ProfileSetup extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            errorMessage: 'ERR_UNKNOWN',
            pictureSelected: false,
            response: null,
            profileName: null,
            profileAge: null,
            profileProfession: null,
            profileCompany: null,
            profilePreferenceIndex: null,
            profileGenderIndex: null,
            profileCountry: null,
            profileState: null,
            profileCity: null
        }
    }

    TAG = 'ProfileSetup:';
    backHandler = null;

    openImagePicker() {
        ToastAndroid.show('Use 3:4 ratio for best results', ToastAndroid.LONG);

        ImagePicker.openPicker({
            enableRotationGesture: true,
            cropping: true,
            cropperActiveWidgetColor: Colors.primary,
            cropperStatusBarColor: Colors.primary,
            cropperToolbarColor: Colors.primary,
            compressImageQuality: 0.7
        }).then(response => {
            if (response !== null) {
                console.log(this.TAG, response)
                this.setState({ response, pictureSelected: true });
                Actions.push('avatarPreview', { avatar_url: response.path });
            }
        })
            .catch(error => console.log(this.TAG, error));
    }

    async checkInternet() {
        const status = await NetInfo.fetch();
        if (!status.isConnected) {
            this.setState({ errorMessage: 'ERR_NO_INTERNET' });
            throw Error();
        }
    }

    async checkProfileValues() {
        if (this.state.profileName == null || this.state.profileAge == null || this.state.profileCompany == null || this.state.profileProfession == null || this.state.profileGenderIndex == null || this.state.profilePreferenceIndex == null) {
            this.setState({ errorMessage: 'ERR_INVALID_VALUE' });
            throw Error();
        }
    }

    async uploadAvatar() {
        console.log(this.TAG, 'Called uploadAvatar');
        if (!this.state.pictureSelected) {
            console.log(this.TAG, 'Avatar was empty');
            ToastAndroid.show('Avatar was null', ToastAndroid.LONG);
            return;
        }
        else {
            //Get the phone number from local storage to create the reference for the avatar storage
            var phoneNumber = await AsyncStorage.getItem('PHONE_NUMBER');

            try {
                await storage().ref(`avatar/${phoneNumber}`).putFile(this.state.response.path);
            }
            catch (error) {
                console.log(this.TAG, error)
                this.setState({ errorMessage: 'ERR_STORAGE' });
                throw Error();
            }
        }
    }

    async getAvatarUrl() {
        console.log(this.TAG, 'Called getAvatarUrl');
        //Get the phone number for the avatar refernce
        var phoneNumber = await AsyncStorage.getItem('PHONE_NUMBER');

        try {
            const avatarUrl = await storage().ref(`avatar/${phoneNumber}`).getDownloadURL();
            await AsyncStorage.setItem('AVATAR_URL', avatarUrl);
        }
        catch (error) {
            this.setState({ errorMessage: 'ERR_STORAGE' });
            throw Error();
        }
    }

    async getLocation() {

        //Check for location access.
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                'title': 'Flambr',
                'message': 'Flambr wants to access your location '
            }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log(this.TAG, 'Location permission granted');

            Geolocation.getCurrentPosition(position => {
                console.log(this.TAG, 'Got postion:', position);

                var latitude = Number(position.coords.latitude);
                var longitude = Number(position.coords.longitude);

                var prox = `prox=${latitude},${longitude},250`;

                //TODO: Replace API key and APP codes
                fetch("https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?" + prox + "&mode=retrieveAddresses&maxresults=1&gen=9&app_id=<Your App Id>&app_code=<You App Code>")
                    .then(resp => resp.json())
                    .then(resp => {
                        console.log(this.TAG, 'Response:', resp);
                        var profileCountry = resp.Response.View[0].Result[0].Location.Address.Country;
                        var profileState = resp.Response.View[0].Result[0].Location.Address.State;
                        var profileCity = resp.Response.View[0].Result[0].Location.Address.City;

                        this.setState({ profileCountry, profileState, profileCity });
                        console.log(this.TAG, this.state);

                        this.createFirestoreProfile();
                    });
                }, error => {
                    this.setState({ errorMessage: 'ERR_LOCATION', loading: false });
                    ToastAndroid.show('Error while getting the location', ToastAndroid.LONG);
            }, {
                enableHighAccuracy: false, timeout: 10000
            });
        }
        else {
            //Permission was not granted. Throw an error.
            this.setState({ errorMessage: 'ERR_LOCATION_PERMISSION_DENIED' });
            throw Error();
        }
        
    }

    async createFirestoreProfile() {
        console.log(this.TAG, 'Called createFirestoreProfile. State:', this.state);

        var { profileCountry, profileState, profileCity, profileName, profileAge, profileGenderIndex, profilePreferenceIndex, profileProfession, profileCompany } = this.state;

        //Convert age to number for uploading
        var numberProfileAge = parseInt(profileAge, 10);

        let profileGender = null;
        let profilePreference = null;

        //Set value of gender
        if (profileGenderIndex == 0)
            profileGender = 'male';
        else
            profileGender = 'female';
        
        //Set value of preference for this user
        if (profilePreferenceIndex == 0) {
            profilePreference = 'male';
        }
        else if (profilePreferenceIndex == 1) {
            profilePreference = 'female';
        }
        else {
            profilePreference = 'both'
        }

        let phoneNumber = null;
        let avatarUrl = null;
        let userDocRef = null;

        try {
            await AsyncStorage.setItem('USER_NAME', profileName);
            await AsyncStorage.setItem('USER_GENDER', profileGender);
            await AsyncStorage.setItem('USER_PREF', profilePreference);
            await AsyncStorage.setItem('USER_COUNTRY', profileCountry);

            //Also get the phone number and avatar url from local storage
            phoneNumber = await AsyncStorage.getItem('PHONE_NUMBER');
            avatarUrl = await AsyncStorage.getItem('AVATAR_URL');

            //Lastly, create the user document reference that will be stored to local storage
            const ref = `users/${profileCountry}/${profileState}-${profileCity}/${phoneNumber}`;
            console.log(this.TAG, 'Created the user document reference', ref);

            await AsyncStorage.setItem('USER_DOC_REF', ref);
            userDocRef = ref;
        }
        catch (error) {
            console.log(this.TAG, error);
            this.setState({ errorMessage: 'ERR_ASYNC_STORAGE', loading: false });
            throw Error();
        }

        console.log(this.TAG, userDocRef);

        //First insert all the profiel values
        firestore().doc(userDocRef).set({
            name: profileName,
            age: numberProfileAge,
            gender: profileGender,
            preference: profilePreference,
            joining_date: firestore.Timestamp.now(),
            avatar_url: avatarUrl,
            path_to_document: userDocRef,
            job: profileProfession,
            company: profileCompany
        }, { merge: false })
            .then(success => {
                console.log(this.TAG, success);
            })
            .catch(error => {
                this.setState({ errorMessage: 'ERR_FIRESTORE', loading: false });
                console.log(this.TAG, error);
            });

            //Now we insert the parial path for later use in signing in
            const allUsersRef = `all_users/${phoneNumber}`;
            const partialPath = `users/${profileCountry}/${profileState}-${profileCity}`;

        firestore().doc(allUsersRef).set({
            path_to_document: partialPath,
            pin: this.props.pin
        }, { merge: false })
            .then(success => {
                console.log(this.TAG, success);
            })
            .catch(error => {
                this.setState({ errorMessage: 'ERR_FIRESTORE', loading: false });
                console.log(this.TAG, error);
            });
        
        //After completing everything, move to main screen
        Actions.push('bottomNavigator');
    }

    createProfile() {
        console.log(this.TAG, 'Called createProfile');

        this.setState({ loading: true, errorMessage: 'ERR_UNKNOWN' });

        this.checkInternet()
            .then(() => this.checkProfileValues())
            .then(() => this.uploadAvatar())
            .then(() => this.getAvatarUrl())
            .then(() => this.getLocation())
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ loading: false });
                const { errorMessage } = this.state;

                switch (errorMessage) {
                    case 'ERR_NO_INTERNET':
                        ToastAndroid.show('No internet', ToastAndroid.LONG);
                        break
                    case 'ERR_INVALID_VALUE':
                        ToastAndroid.show('Invalid values were entered', ToastAndroid.LONG);
                        break
                    case 'ERR_STORAGE':
                        ToastAndroid.show('Error occurred while uploading the avatar', ToastAndroid.LONG);
                        break
                    case 'ERR_LOCATION_PERMISSION_DENIED':
                        ToastAndroid.show('Please grant location permission', ToastAndroid.LONG);
                        break
                    case 'ERR_LOCATION':
                        ToastAndroid.show('Error while getting the location', ToastAndroid.LONG);
                        break
                    case 'ERR_ASYNC_STORAGE':
                        ToastAndroid.show('A fatal error occurred', ToastAndroid.LONG);
                        break
                    case 'ERR_FIRESTORE':
                        ToastAndroid.show('Error while communicating with the server', ToastAndroid.LONG);
                        break
                    default:
                        ToastAndroid.show('Some error occurred. Please try again', ToastAndroid.LONG);
                        break
                }
            });
    }

    render() {
        if (this.state.loading) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

                    <ActivityIndicator size='large' color={Colors.primary} />

                    <Text style={{ marginTop: 20, marginBottom: 10, fontFamily: 'comfortaa.regular', fontSize: 20, color: 'black', paddingHorizontal: 40, textAlign: 'center' }}>Don't close the app</Text>
                    
                    <Text style={{ marginTop: 10, fontFamily: 'comfortaa.regular', fontSize: 20, color: 'black', paddingHorizontal: 40, textAlign: 'center' }}>Uploading the avatar may take a few seconds</Text>
                </View>
            )
        }

        return (
            <View style={{ flex: 1 }}>
                
                <Header
                    placement='center'
                    leftComponent={{ text: 'Profile Setup', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                    leftContainerStyle={{ paddingLeft: 10 }}
                    centerContainerStyle={{ flex: 0, height: 0, width: 0 }}
                    rightContainerStyle={{ flex: 0, height: 0, width: 0 }}
                    backgroundColor={Colors.headerGrey} />
                
                <ScrollView style={{ paddingHorizontal: 40, flexDirection: 'column' }}>
                    
                    {this.state.pictureSelected ?
                        <Avatar
                            rounded
                            showEditButton={true}
                            source={{ uri: this.state.response.path }}
                            onEditPress={() => this.openImagePicker()}
                            size='xlarge'
                            renderPlaceholderContent={<Icon name='person' type='material-icon' size={28} />}
                            containerStyle={{ marginTop: 40, marginBottom: 10, alignSelf: 'center' }}
                            onLongPress={() => this.handleAvatarLongPress()}
                        />
                        :
                        <Avatar
                            rounded
                            showEditButton={true}
                            onEditPress={() => this.openImagePicker()}
                            size='xlarge'
                            renderPlaceholderContent={<Icon name='person' type='material-icon' size={28} />}
                            containerStyle={{ marginTop: 40, marginBottom: 10, alignSelf: 'center' }}
                            onLongPress={() => this.handleAvatarLongPress()}
                        />

                    }

                    {this.state.pictureSelected ?
                        <View></View>
                        :
                        <Text style={{ fontFamily: 'comfortaa.regular', color: 'red', fontSize: 14, marginBottom: 30, alignSelf: 'center' }}>No profile picture selected</Text>
                    }

                    <Input
                        placeholder='Name'
                        inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                        label='Full Name'
                        labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                        leftIcon={<Icon name='person' type='material-icon' size={18} color='black' />}
                        onChangeText={profileName => this.setState({ profileName })}
                        value={this.state.profileName}
                        containerStyle={{ marginBottom: 10 }}
                        autoCapitalize='words'
                        placeholderTextColor={Colors.greyLight}
                        inputContainerStyle={{ borderColor: 'black' }} />

                    <Input
                        placeholder='Age'
                        inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                        label='Age'
                        labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                        leftIcon={<Icon name='person' type='material-icon' size={18} color='black' />}
                        onChangeText={profileAge => this.setState({ profileAge })}
                        value={this.state.profileAge}
                        containerStyle={{ marginTop: 10, marginBottom: 10 }}
                        keyboardType='numeric'
                        placeholderTextColor={Colors.greyLight}
                        inputContainerStyle={{ borderColor: 'black' }} />

                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>I am a</Text>

                    <SegmentedControlTab
                        values={['Man', 'Woman']}
                        selectedIndex={this.state.profileGenderIndex}
                        onTabPress={profileGenderIndex => this.setState({ profileGenderIndex })}
                        borderRadius={30}
                        tabTextStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: Colors.primary }}
                        activeTabOpacity={0.5}
                        activeTabStyle={{ backgroundColor: Colors.primary }}
                        tabsContainerStyle={{ marginBottom: 10, marginTop: 10 }}
                        tabStyle={{ borderColor: Colors.primary }}
                        accessibilityLabels={['Man', 'Woman']}
                    />

                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>interested in</Text>

                    <SegmentedControlTab
                        values={['Men', 'Women', 'Anyone']}
                        selectedIndex={this.state.profilePreferenceIndex}
                        onTabPress={profilePreferenceIndex => this.setState({ profilePreferenceIndex })}
                        borderRadius={30}
                        tabTextStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: Colors.primary }}
                        activeTabOpacity={0.5}
                        activeTabStyle={{ backgroundColor: Colors.primary }}
                        tabsContainerStyle={{ marginBottom: 10, marginTop: 10 }}
                        tabStyle={{ borderColor: Colors.primary }}
                        accessibilityLabels={['Man', 'Woman']}
                    />

                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>Profession</Text>

                    <Input
                        placeholder='Profession'
                        inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                        label='Profession'
                        labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                        leftIcon={<Icon name='work' type='material-icon' size={18} color='black' />}
                        onChangeText={profileProfession => this.setState({ profileProfession })}
                        value={this.state.profileProfession}
                        containerStyle={{ marginBottom: 10, marginTop: 10 }}
                        autoCapitalize='words'
                        placeholderTextColor={Colors.greyLight}
                        inputContainerStyle={{ borderColor: 'black' }} />

                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>Workplace</Text>

                    <Input
                        placeholder='Company Name'
                        inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                        label='Workplace'
                        labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                        leftIcon={<Icon name='home' type='material-icon' size={18} color='black' />}
                        onChangeText={profileCompany => this.setState({ profileCompany })}
                        value={this.state.profileCompany}
                        containerStyle={{ marginBottom: 10, marginTop: 10 }}
                        autoCapitalize='words'
                        placeholderTextColor={Colors.greyLight}
                        inputContainerStyle={{ borderColor: 'black' }} />

                    <Button
                        title='Create Profile'
                        onPress={() => this.createProfile()}
                        type='solid'
                        titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                        containerStyle={{ width: '100%' }}
                        buttonStyle={{ borderRadius: 60, marginVertical: 40, backgroundColor: Colors.primary }}
                        disabled={this.state.disabled}
                        disabledStyle={{ backgroundColor: '#d6d4d4' }} />
                </ScrollView>

            </View>
        )
    }
}
