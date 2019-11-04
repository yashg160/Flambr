import React, { Component } from 'react';
import { View, Text, Alert, Dimensions, ToastAndroid, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import SegmentedControlTab from "react-native-segmented-control-tab";
import { Avatar, Input, Button, Header } from 'react-native-elements';
import ImagePicker from 'react-native-image-crop-picker';
import * as Colors from '../../assets/Colors';
import { Actions } from 'react-native-router-flux';

//TODO: Add check for internet connection

export default class ProfileEditMain extends Component {

    TAG = 'Profile Edit: ';

    constructor() {
        super();
        this.state = {
            avatarUrl: null,
            uploading: false,
            valueTouched: false,
            imageChanged: false,
            response: null,
            profileName: null,
            profileAge: null,
            profileProfession: null,
            profileCompany: null,
            profilePreferenceIndex: null,
            profileGenderIndex: null,
            profileGender: null,
            profilePreference: null,
            visible: true,
            error: false
        }
    }

    SCREEN_WIDTH = Dimensions.get('window').width;
    SCREEN_HEIGHT = Dimensions.get('window').height;

    async setInitialAvatar() {

        try {
            const avatarUrl = await AsyncStorage.getItem('AVATAR_URL');
            //Avatar can be null or have some value. If it has somr value, then put the image. Else, render placeholder
            this.setState({ avatarUrl });
            return;
        }
        catch (error) {
            return new Error(error);
        }
    }

    checkInternet() {
        NetInfo.fetch()
            .then(state => {
                if (!state.isConnected)
                    ToastAndroid.show('No internet connection', ToastAndroid.LONG);
            });
    }

    handleAvatarLongPress() {

        Alert.alert(
            'Flambr Profile Setup',
            'Remove profile picture?',
            [
                {
                    text: 'NO',
                    style: 'cancel'
                },
                {
                    text: 'YES',
                    onPress: () => this.setState({ pictureSelected: false, response: null })
                }
            ]
        );
    }

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
                console.log(this.TAG, response);
                this.setState({
                    response, imageChanged: true, valueTouched: true
                });
                //TODO
                Actions.push('avatarPreview', { avatar_url: this.state.response.path });
            }
        });
    }

    async getDocumentReference() {
        console.log(this.TAG, 'getDocRef called');
        try {
            const userDocumentReference = await AsyncStorage.getItem('USER_DOC_REF');
            if (!userDocumentReference)
                return new Error('userDocRef was null');
            return userDocumentReference;
        }
        catch (error) {
            return new Error(error);
        }
    }

    async getPhoneNumber() {
        console.log(this.TAG, 'getPhoneNumber called');
        try {
            const phoneNumber = await AsyncStorage.getItem('PHONE_NUMBER');
            if (!phoneNumber)
                return new Error('Error in getting phone number');
            return phoneNumber;
        }
        catch (error) {
            return new Error('Error in getting phone number');
        }
    }

    async getUserProfile(userDocRef) {
        console.log(this.TAG, 'getUserProfile called');
        await firestore().doc(userDocRef).get()
            .then(userSnapshot => {
                //userSnapshot is a document snapshot. So, use appropriate methods to get the data.
                const profileName = userSnapshot.get('name');

                //Convert number from database to string to display it here in the input field
                const profileAge = userSnapshot.get('age').toString();
                const profileProfession = userSnapshot.get('job');
                const profileCompany = userSnapshot.get('company');
                const profileGender = userSnapshot.get('gender');
                const profilePreference = userSnapshot.get('preference');

                this.setState({ profileName, profileAge, profileProfession, profileCompany, profileGender, profilePreference });

                //To get the gender indexes for the segmented control tab, this is the logic
                if (profileGender == 'male')
                    this.setState({ profileGenderIndex: 0 })
                else
                    this.setState({ profileGenderIndex: 1 });

                //Same logic for the preference index control tabs
                if (profilePreference == 'male')
                    this.setState({ profilePreferenceIndex: 0 });
                else if (profilePreference == 'female')
                    this.setState({ profilePreferenceIndex: 1 })
                else
                    this.setState({ profilePreferenceIndex: 2 });
            });
        return;
    }

    async nameValidation(name) {
        console.log(this.TAG, 'nameValdation called');
        var regex = /^[a-zA-Z ]{2,30}$/;
        if (await regex.test(name))
            return;
        return new Error('Please enter a valid name');
    }

    async ageValidation(age) {
        console.log(this.TAG, 'afeValidation called');
        if (await age > 0 && age < 200)
            return;
        return Error('Please enter a valid age');
    }

    async professionValidation(pro) {
        console.log(this.TAG, 'profValidation called');
        var regex = /^[a-zA-Z. ]{2,30}$/;
        if (await regex.test(pro))
            return;
        return new Error('Please enter a valid profession');
    }

    async companyValidation(comp) {
        console.log(this.TAG, 'compValid called');
        var regex = /^[a-zA-Z. ]{2,30}$/;
        if (await regex.test(comp))
            return;
        return new Error('Please enter a valid company name');
    }

    async updateProfile(userDocRef) {
        console.log(this.TAG, 'updateProfile called. UserDocRef: ', userDocRef);
        //The values to be updated are all set in state. Use the document reference and simply set those values in firestore

        const { profileName, profileAge, profileGender, profilePreference, profileCompany, profileProfession } = this.state;

        //Upload to firestore
        await firestore().doc(userDocRef).set({
            name: profileName,
            age: Number(profileAge),
            gender: profileGender,
            preference: profilePreference,
            company: profileCompany,
            job: profileProfession
        })
            .then(() => {
                console.log(this.TAG, 'Profile update sccuessfull');
                return;
            });
    }

    async uploadPicture(phoneNumber) {
        console.log(this.TAG, 'uploadPic called');
        //Create the reference using the phone number
        var ref = `avatar/${phoneNumber}`;
        console.log(this.TAG, 'Ref: ', ref);

        await storage().ref(ref).putFile(this.state.response.path)
            .then(() => {
                //Upload successfull. Return the reference to get the download url
                return
            });
    }

    async getAvatarUrl(phoneNumber) {
        console.log(this.TAG, 'getAvatarUrl called. phoneNumber: ', phoneNumber);
        //Create the reference using the phoneNumber
        var ref = `avatar/${phoneNumber}`;

        //Get the download url based on the ref passed to function
        const url = await storage().ref(ref).getDownloadURL();

        if (url == null)
            return Error('Error in uploading avatar');

        return url;
    }



    async saveAvatarUrl(url) {
        console.log(this.TAG, 'saveAvatarUrl called: ', url);
        try {
            await AsyncStorage.setItem('AVATAR_URL', url);
        }
        catch (error) {
            return Error('Error in getting avatar url');
        }
        return;
    }

    handleProfileUpdate() {
        console.log(this.TAG, 'handleProfileUpdate called');
        var { profileName, profileAge, profileProfession, profileCompany, profilePreferenceIndex, profileGenderIndex } = this.state;
        let profileGender = null;
        let profilePreference = null;

        //Logic for assigning male or female based on selected index
        if (profileGenderIndex == 0)
            profileGender = 'male';
        else
            profileGender = 'female';

        //Similar logic for assigning preference
        if (profilePreferenceIndex == 0)
            profilePreference = 'male';
        else if (profilePreferenceIndex == 1)
            profilePreference = 'female';
        else
            profilePreference = 'both';

        //Set the new gender and preference values back into the state
        this.setState({ profileGender, profilePreference, disabled: true, visible: true });

        //Here are two possibilities. If the picture was changed, only then upload it storage. 
        //If not, then only update the rest of the values in firestore

        //Also call checkInternet for checking internet connection
        this.checkInternet();

        if (this.state.imageChanged) {
            //Image was changed. Upload to storage

            //Validate the values and upload the image.
            this.nameValidation(profileName)
                .then(() => this.ageValidation(Number(profileAge)))
                .then(() => this.professionValidation(profileProfession))
                .then(() => this.companyValidation(profileCompany))
                .then(() => this.getPhoneNumber())
                .then((phoneNumber) => this.uploadPicture(phoneNumber))
                .then(() => this.getPhoneNumber())
                .then((phoneNumber) => this.getAvatarUrl(phoneNumber))
                .then((url) => this.saveAvatarUrl(url))
                .then(() => this.getDocumentReference())
                .then((userDocRef) => this.updateProfile(userDocRef))
                .then(() => {
                    //Image upload and profile updation was successfull
                    console.log(this.TAG, 'imageChanged: ', this.state.imageChanged, 'Successfull');
                    ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT);
                    Actions.pop();
                })
                .catch(error => {
                    //Update was not successfull
                    console.log(this.TAG, 'imageChanged: ', this.state.imageChanged, error);
                    ToastAndroid.show(error.message, ToastAndroid.SHORT);
                    this.setState({ disabled: false, error: true, visible: false });
                });

        }

        else {
            //Image was not changed. Only update the rest of the values

            //Validate all the other values
            this.nameValidation(profileName)
                .then(() => this.ageValidation(Number(profileAge)))
                .then(() => this.professionValidation(profileProfession))
                .then(() => this.companyValidation(profileCompany))
                .then(() => this.getDocumentReference())
                .then((userDocRef) => this.updateProfile(userDocRef))
                .then(() => {
                    //Update successfull. Handle by navigating back to settings screen
                    console.log(this.TAG, 'imageChanged: ', this.state.imageChanged, 'Successfull');
                    ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT);
                    Actions.pop();
                })
                .catch(error => {
                    //Update was not successfull
                    console.log(this.TAG, 'imageChanged: ', this.state.imageChanged, error);
                    ToastAndroid.show(error.message, ToastAndroid.SHORT);
                    this.setState({ disabled: false, error: true, visible: false });
                });
        }

    }

    componentDidMount() {
        this.setInitialAvatar()
            .then(() => this.getDocumentReference())
            .then((userDocRef) => this.getUserProfile(userDocRef))
            .then(() => this.setState({ visible: false }))
            .catch(error => {
                console.log(this.TAG, error);
                ToastAndroid.show('There was an error in getting your profile', ToastAndroid.LONG);
                this.setState({ error: true, visible: false });
            });
    }

    render() {
        let imageSource = null;
        if (this.state.imageChanged) {
            imageSource = this.state.response.path;
        }
        else {
            if (this.state.avatarUrl !== null)
                imageSource = this.state.avatarUrl
        }

        if (this.state.visible) {
            return (
                <ActivityIndicator size='large' color={Colors.primary} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />
            )
        }

        else {
            return (
                <View style={{ flex: 1 }}>

                    <Header
                        placement='center'
                        leftComponent={<Icon type='material' name='chevron-left' color={Colors.primary} size={32} onPress={() => Actions.pop()} />}
                        centerComponent={{ text: 'Edit Profile', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 28 } }}
                        backgroundColor={Colors.headerGrey} />

                    <ScrollView style={{ paddingHorizontal: 40, flexDirection: 'column', paddingTop: '1%' }}>

                        {imageSource === null ?
                            <Avatar
                                rounded
                                showEditButton={true}
                                onEditPress={() => this.openImagePicker()}
                                size='xlarge'
                                renderPlaceholderContent={<Icon name='person' type='material-icon' size={28} />}
                                containerStyle={{ marginVertical: 60, alignSelf: 'center' }}
                                onLongPress={() => this.handleAvatarLongPress()}
                            />
                            :
                            <Avatar
                                rounded
                                source={{ uri: imageSource }}
                                showEditButton={true}
                                onEditPress={() => this.openImagePicker()}
                                size='xlarge'
                                renderPlaceholderContent={<Icon name='person' type='material-icon' size={28} />}
                                containerStyle={{ marginVertical: 60, alignSelf: 'center' }}
                                onLongPress={() => this.handleAvatarLongPress()}
                            />
                        }
                        <Input
                            placeholder='Name'
                            inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                            label='Full Name'
                            labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                            leftIcon={<Icon name='person' type='material-icon' size={18} color='black' />}
                            onChangeText={profileName => this.setState({ profileName, valueTouched: true })}
                            value={this.state.profileName}
                            containerStyle={{ marginBottom: 10 }}
                            autoCapitalize='words'
                            placeholderTextColor={Colors.greyLight}
                            inputContainerStyle={{ borderColor: 'black' }}
                            editable={!this.state.disabled} />

                        <Input
                            placeholder='Age'
                            inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                            label='Age'
                            labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                            leftIcon={<Icon name='person' type='material-icon' size={18} color='black' />}
                            onChangeText={profileAge => this.setState({ profileAge, valueTouched: true })}
                            value={this.state.profileAge}
                            containerStyle={{ marginTop: 10, marginBottom: 10 }}
                            keyboardType='numeric'
                            placeholderTextColor={Colors.greyLight}
                            inputContainerStyle={{ borderColor: 'black' }}
                            editable={!this.state.disabled} />

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>I am a</Text>

                        <SegmentedControlTab
                            values={['Man', 'Woman']}
                            selectedIndex={this.state.profileGenderIndex}
                            onTabPress={profileGenderIndex => this.setState({ profileGenderIndex, valueTouched: true })}
                            borderRadius={30}
                            tabTextStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: Colors.primary }}
                            activeTabOpacity={0.5}
                            activeTabStyle={{ backgroundColor: Colors.primary }}
                            tabsContainerStyle={{ marginBottom: 10, marginTop: 10 }}
                            accessibilityLabels={['Man', 'Woman']}
                            tabStyle={{ borderColor: Colors.primary }}
                            enabled={!this.state.disabled} />

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>interested in</Text>

                        <SegmentedControlTab
                            values={['Men', 'Women', 'Anyone']}
                            selectedIndex={this.state.profilePreferenceIndex}
                            onTabPress={profilePreferenceIndex => this.setState({ profilePreferenceIndex, valueTouched: true })}
                            borderRadius={30}
                            tabTextStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: Colors.primary }}
                            activeTabOpacity={0.5}
                            activeTabStyle={{ backgroundColor: Colors.primary }}
                            tabsContainerStyle={{ marginBottom: 10, marginTop: 10 }}
                            accessibilityLabels={['Men', 'Women', 'Anyone']}
                            tabStyle={{ borderColor: Colors.primary }}
                            enabled={!this.state.disabled}
                        />

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>Profession</Text>

                        <Input
                            placeholder='Profession'
                            inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                            label='Profession'
                            labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                            leftIcon={<Icon name='work' type='material-icon' size={18} color='black' />}
                            onChangeText={profileProfession => this.setState({ profileProfession, valueTouched: true })}
                            value={this.state.profileProfession}
                            containerStyle={{ marginBottom: 10, marginTop: 10 }}
                            autoCapitalize='words'
                            placeholderTextColor={Colors.greyLight}
                            inputContainerStyle={{ borderColor: 'black' }}
                            editable={!this.state.disabled} />

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'black', marginTop: 10, marginBottom: 10 }}>Workplace</Text>

                        <Input
                            placeholder='Company Name'
                            inputStyle={{ fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black' }}
                            label='Workplace'
                            labelStyle={{ fontFamily: 'Robota-Regular', fontSize: 14, color: Colors.greyLight }}
                            leftIcon={<Icon name='home' type='material-icon' size={18} color='black' />}
                            onChangeText={profileCompany => this.setState({ profileCompany, valueTouched: true })}
                            value={this.state.profileCompany}
                            containerStyle={{ marginBottom: 10, marginTop: 10 }}
                            autoCapitalize='words'
                            placeholderTextColor={Colors.greyLight}
                            inputContainerStyle={{ borderColor: 'black' }}
                            editable={!this.state.disabled} />

                        <Button
                            title='Update Profile'
                            onPress={() => this.handleProfileUpdate()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                            containerStyle={{ width: '100%' }}
                            buttonStyle={{ borderRadius: 60, marginVertical: 40, backgroundColor: Colors.primary }}
                            disabled={!this.state.valueTouched || this.state.disabled}
                            disabledStyle={{ backgroundColor: '#d6d4d4' }} />

                    </ScrollView>
                </View>
            );
        }

    }
}