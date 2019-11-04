import React, { Component } from 'react';
import { View, Text, ToastAndroid, ActivityIndicator, PermissionsAndroid, ImageBackground, Dimensions, Share, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-community/async-storage';
import CardStack, { Card } from 'react-native-card-stack-swiper';
import { Button, Header, Icon } from 'react-native-elements';
import * as Colors from '../../assets/Colors';
import LinearGradient from 'react-native-linear-gradient';
import { Actions } from 'react-native-router-flux';

export default class Main extends Component {

    TAG = 'Main Screen';
    SCREEN_HEIGHT = Dimensions.get('window').height;
    SCREEN_WIDTH = Dimensions.get('window').width;
    backHandler = null;

    constructor() {
        super();

        this.state = {
            loading: true,
            error: false,
            errorMessage: 'ERR_UNKNOWN',
            resp: null,
            people: [],
            peopleReference: null,
            currentPerson: 0,
            startAfterDocument: null,
            userDocumentReference: null,
            isVisible: false,
            country: null,
            st: null,
            city: null,
            userGender: null,
            userPreference: null,
            getMoreDisabled: true,
            swiper: null
        }

    }

    //ALl functions related to getting people from firestore
    async getInternetStatus() {
        //Get the state from NetInfo
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            this.setState({ errorMessage: 'ERR_NO_INTERNET' });
            throw Error();
        }

    }

    async getAsyncStorageValues() {
        const userDocRef = await AsyncStorage.getItem('USER_DOC_REF');
        const userPreference = await AsyncStorage.getItem('USER_PREF');

        //Also set signed in to true here
        await AsyncStorage.setItem('IS_SIGNED_IN', 'true');

        if (userDocRef == null || userPreference == null) {
            this.setState({ error: true, errorMessage: 'ERR_ASYNC_STORAGE' });
            throw Error();
        }
        else {
            this.setState({ userDocumentReference: userDocRef, userPreference });
        }
    }

    async checkPremiumUser() {
        const { userDocumentReference } = this.state;
        //Get current date from the system
        const currentDate = new Date();

        const userSnapshot = await firestore().doc(userDocumentReference).get();
        const expirationDate = userSnapshot.get('expiration_date');

        //Compare the current date and the expiration date. If plan is expired, set the is premium flag to false.
        //The expiration date is uploaded as Date format in firestore

        //Expiration date will be null initially. It will be set to null at profile creation time
        if (currentDate >= expirationDate || expirationDate == null) {
            await AsyncStorage.setItem('IS_PREMIUM', 'false');
            return;
        }
    }

    async getPosition() {
        console.log(this.TAG, 'Called getPosition...');

        //Get location permission
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                'title': 'Flambr',
                'message': 'Flambr wants to access your location '
            }
        );

        //Proceed based on permission was granted or not
        //Permission was granted

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
                position => {
                    //Position retrieval success
                    //Convert latitude and latitiude to numbers
                    var lat = Number(position.coords.latitude);
                    var lon = Number(position.coords.longitude);

                    var prox = `prox=${lat},${lon},250`;

                    fetch("https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?" + prox + "&mode=retrieveAddresses&maxresults=1&gen=9&app_id=lWzIoo7zWjWAFoyAgi0H&app_code=yKLq0TaA3MXNOVVuCuSyWQ")
                        .then((resp) => resp.json())
                        .then((resp) => {
                            this.setState({ resp });

                            this.getLocation()
                                .then((location) => this.getPeopleFromFirestore(location))
                                .then((docsArray) => this.setPeopleInState(docsArray))
                                .then(() => {
                                    //Everything was ok. All promises resolved correctly
                                    this.setState({ loading: false, error: false });
                                })
                                .catch((error) => {
                                    console.log(this.TAG, error);
                                    //There was some error in getting the data
                                    this.setState({ loading: false, error: true });
                                    if (this.state.errorMessage == 'ERR_NO_PEOPLE') {
                                        ToastAndroid.show('No nearby people', ToastAndroid.SHORT);
                                        return;
                                    }
                                    else {
                                        ToastAndroid.show('An error occurred', ToastAndroid.LONG);
                                        return;
                                    }
                                });
                        });

                },
                failure => {
                    //Position retrieval failed
                    this.setState({ errorMessage: 'ERR_LOCATION', error: true, loading: false });
                }, {
                //options
                timeout: 4000,
                enableHighAccuracy: false
            });
        }

        else {
            //Permission was denied
            this.setState({ errorMessage: 'ERR_LOCATION_PERMISSION_DENIED' });
            throw Error();
        }
    }

    //The response is converted to json inside the previous function. The resp is set in state.
    //The resp is then retrieved by getLocation method and then used
    async getLocation() {
        const { resp } = this.state;

        var country = resp.Response.View[0].Result[0].Location.Address.Country;
        var st = resp.Response.View[0].Result[0].Location.Address.State;
        var city = resp.Response.View[0].Result[0].Location.Address.City;

        this.setState({ country, st, city });

        return { country, st, city };
    }

    //Object containing country, state and city is passed to the next function
    async getPeopleFromFirestore(location) {
        console.log(this.TAG, 'getPeopleFromFirestore called. Location: ', location);

        var { country, st, city } = location;
        var { userPreference } = this.state;

        //docsArray is an array of document snapshots
        var docsArray = [];

        //This reference is the one from which we read the documents
        const ref = `users/${country}/${st}-${city}`;
        //Set this reference is state also so that it can be used later
        this.setState({ peopleReference: ref });

        const querySnapshot = await firestore().collection(ref).limit(25).get();
        //Check if querySnapshot is empty.
        if (querySnapshot.empty) {
            this.setState({ errorMessage: 'ERR_NO_PEOPLE' });
            throw Error();
        }
        else {
            //Query snapshot is not empty. Get the array of all the documentSnapshots. 
            //Iterate over all these snapshots and compare the gender to the userPreference.
            //Those that have the same gender as the userPreferene, add those to the array to be returned.

            const peopleArray = querySnapshot.docs;

            //Set the last element as the startAfterDocument on the state

            const startAfterDocument = peopleArray[peopleArray.length - 1];
            console.log(this.TAG, 'The startAfterDocument is: ', startAfterDocument);
            this.setState({ startAfterDocument });

            peopleArray.map((docSnapshot) => {

                if (docSnapshot.get('gender') == userPreference)
                    docsArray.push(docSnapshot);
            });

            return docsArray;
        }
    }

    async setPeopleInState(docsArray) {
        console.log(this.TAG, 'setPeopleInState called. The array is: ', docsArray);
        this.setState({ loading: true });

        this.state.people = [];
        var n = docsArray.length;

        for (let i = 0; i < n; i++) {
            docSnapshot = docsArray[i];

            var avatar_url = docSnapshot.get('avatar_url');
            var name = docSnapshot.get('name');
            var age = docSnapshot.get('age');
            var path_to_document = docSnapshot.get('path_to_document');
            var job = docSnapshot.get('job');
            var company = docSnapshot.get('company');
            var phoneNumber = docSnapshot.id;

            this.state.people.push({
                avatar_url,
                name,
                age,
                path_to_document,
                job,
                company,
                phoneNumber
            });
        }
    }


    //All functions related to right swiping and handling matches
    async addUserToPerson(personReference) {
        console.log(this.TAG, 'addUserToPerson called', personReference);

        const { userDocumentReference } = this.state;
        //Create this person's phone number to store into the liked person's liked_by_people collection
        const userPhoneNumber = userDocumentReference.split('/')[3];

        //This function will add this users's reference to the right swiped person's liked by people collection
        await firestore().doc(personReference).collection('liked_by_people').doc(userPhoneNumber).set({
            path_to_document: userDocumentReference,
            match: false
        });
    }

    async checkPersonLikedUser(personReference) {
        console.log(this.TAG, 'Called checkPersonLikedUser with:', personReference);

        //Get the right swiped person's phone number
        const personPhoneNumber = personReference.split('/')[3];

        const { userDocumentReference } = this.state;

        let personStatus = null;

        await firestore().doc(userDocumentReference).collection('liked_by_people').doc(personPhoneNumber).get()
            .then(docSnapshot => {
                if (!docSnapshot.exists)
                    personStatus = 'USER_NOT_LIKED'
                else {

                    if (docSnapshot.get('match'))
                        personStatus = 'ALREADY_MATCHED'
                    else
                        personStatus = 'NEW_MATCH'
                }
            });

        return personStatus;
    }

    async handleRightSwipe(personReference) {

        console.log(this.TAG, 'handleRightSwipe called. Liked person reference: ', personReference);

        //Create the phone number of the liked person from the document reference
        const personPhoneNumber = personReference.split('/')[3];

        const { userDocumentReference } = this.state;
        const userPhoneNumber = userDocumentReference.split('/')[3];

        if (userPhoneNumber == personPhoneNumber) {
            ToastAndroid.show('Nice! You right swiped yourself', ToastAndroid.LONG);
            return;
        }

        if (personReference == null) {
            ToastAndroid.show('An unexpected error occurred', ToastAndroid.SHORT);
            return;
        }

        this.checkPersonLikedUser(personReference)
            .then((personStatus) => {
                if (personStatus == 'USER_NOT_LIKED')
                    this.addUserToPerson(personReference)
                else if (personStatus == 'ALREADY_MATCHED')
                    ToastAndroid.show('Already a match', ToastAndroid.SHORT)
                else if (personStatus == 'NEW_MATCH') {
                    Actions.push('matchPerson', { name: this.state.people[this.state.currentPerson].name, avatarUrl: this.state.people[this.state.currentPerson].avatar_url, phoneNumber: this.state.people[this.state.currentPerson].phoneNumber, personReference})
                }
            })
            .catch(error => {
                ToastAndroid.show('Error. Could not check for match', ToastAndroid.SHORT);
                console.log(this.TAG, error)
            });

    }


    //Function to render when no more cards are there
    renderNoMoreCards() {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular' }}>Touch the button to load more people</Text>
                <Button
                    title='Get More People'
                    onPress={() => this.handleGetMorePeople()}
                    type='solid'
                    titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                    containerStyle={{ width: '60%' }}
                    buttonStyle={{ borderRadius: 50, marginVertical: 20, backgroundColor: Colors.primary }}
                    disabled={this.state.getMoreDisabled}
                    disabledStyle={{ backgroundColor: 'grey' }} />

                <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }} onPress={() => this.handleSharePress()}>This app is more fun with more people around.<Text style={{ color: Colors.mayaBlue }}> Share with your friends</Text></Text>
            </View>

        )
    }



    //Handling more people button touch
    handleGetMorePeople() {
        console.log(this.TAG, 'handleGetMorePeople called');
        this.setState({ loading: true, getMoreDisabled: true, currentPerson: 0 });

        this.getMorePeople()
            .then(docsArray => this.setPeopleInState(docsArray))
            .then(() => {
                this.setState({ loading: false, error: false });
            })
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ error: true, loading: false })
                if (this.state.errorMessage == 'ERR_NO_PEOPLE') {
                    ToastAndroid.show('No nearby people found', ToastAndroid.SHORT);
                }
                else {
                    ToastAndroid.show('An error occurred', ToastAndroid.SHORT);
                }
            });
    }

    async getMorePeople() {
        console.log(this.TAG, 'Called getMorePople');

        //Get the startAfterDocument from the state
        const { startAfterDocument, peopleReference, userPreference } = this.state;
        console.log(this.TAG, startAfterDocument);

        //This is an empty array that is used as a placehold
        var docsArray = [];

        const querySnapshot = await firestore().collection(peopleReference).orderBy('age').startAfter(startAfterDocument).limit(25).get();

        //Check if querySnapshot is empty.
        if (querySnapshot.empty) {
            this.setState({ errorMessage: 'ERR_NO_PEOPLE' });
            throw Error();
        }
        else {
            const peopleArray = querySnapshot.docs;

            //Set the last element as the startAfterDocument on the state

            const startAfterDocument = peopleArray[peopleArray.length - 1];
            console.log(this.TAG, 'The startAfterDocument is: ', startAfterDocument);
            this.setState({ startAfterDocument });

            peopleArray.map((docSnapshot) => {

                if (docSnapshot.get('gender') == userPreference)
                    docsArray.push(docSnapshot);
            });

            return docsArray;
        }

    }



    //Other functions for varous functionalities


    async handleShare() {
        try {
            const result = await Share.share({
                title: 'Flambr Dating App',
                message: 'Hey! Check out this new dating app Flambr. Its awesome! Join now!'
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log(this.TAG, 'Shared with activity tye of result.activityType');
                    ToastAndroid.show('Thanks for sharing!', ToastAndroid.LONG);
                } else {
                    console.log(this.TAG, 'Shared the app');
                    ToastAndroid.show('Thanks for sharing!', ToastAndroid.LONG);
                }
            } else if (result.action === Share.dismissedAction) {
                console.log(this.TAG, 'Dismissed share');
                ToastAndroid.show('Please share the app to get more people registered', ToastAndroid.LONG);
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


    componentDidMount() {
        this.getInternetStatus()
            .then(() => this.getAsyncStorageValues())
            .then(() => this.checkPremiumUser())
            .then(() => this.getPosition())
            .then(() => console.log(this.TAG, 'Data retrieved successfully'))
            .catch(error => {
                this.setState({ loading: false, error: true });
                console.log(this.TAG, error);
                const { errorMessage } = this.state;
                if (errorMessage == 'ERR_NO_INTERNET') {
                    ToastAndroid.show('No internet connection', ToastAndroid.SHORT);
                }
                else if (errorMessage == 'ERR_ASYNC_STORAGE') {
                    ToastAndroid.show('An error occurred', ToastAndroid.SHORT);
                }
                else if (errorMessage == 'ERR_LOCATION') {
                    ToastAndroid.show('Error in getting location', ToastAndroid.LONG);
                }
                else if (errorMessage == 'ERR_LOCATION_PERMISSION_DENIED') {
                    ToastAndroid.show('Location permission denied', ToastAndroid.LONG);
                }
            });
    }

    //Retry method for main chain called inside of componentDidMount()
    mainRetry() {

        this.setState({ loading: true, errorMessage: 'ERR_UNKNOWN', error: false });

        this.getInternetStatus()
            .then(() => this.getAsyncStorageValues())
            .then(() => this.checkPremiumUser())
            .then(() => this.getPosition())
            .then(() => { console.log(this.TAG, 'Retry data successfully retrieved') })
            .catch(error => {
                console.log(this.TAG, error);
                this.setState({ loading: false, error: true });
                const { errorMessage } = this.state;
                if (errorMessage == 'ERR_NO_INTERNET') {
                    ToastAndroid.show('No internet connection', ToastAndroid.SHORT);
                }
                else if (errorMessage == 'ERR_ASYNC_STORAGE') {
                    ToastAndroid.show('An error occurred', ToastAndroid.SHORT);
                }
                else if (errorMessage == 'ERR_LOCATION') {
                    ToastAndroid.show('Error in getting location', ToastAndroid.LONG);
                }
                else if (errorMessage == 'ERR_LOCATION_PERMISSION_DENIED') {
                    ToastAndroid.show('Location permission denied', ToastAndroid.LONG);
                }
            });
    }

    render() {
        if (this.state.loading) {
            return (
                <ActivityIndicator size='large' style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} color={Colors.primary} />
            )
        }

        else if (this.state.error) {

            if (this.state.errorMessage == 'ERR_UNKNOWN') {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', marginBottom: 8, paddingHorizontal: 40 }}>An unknown error occurred</Text>

                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />

                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', marginTop: 8, paddingHorizontal: 40, textAlign: 'center' }}>Didn't work? No worries. Just restart the app.</Text>

                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_NO_PEOPLE' && this.state.peopleReference != []) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40 }}>No nearby people were found :(</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.handleGetMorePeople()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginVertical: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />

                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }} onPress={() => this.handleSharePress()}>This app is more fun with more people around.<Text style={{ color: Colors.mayaBlue }}> Share with your friends</Text></Text>
                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_NO_PEOPLE' && this.state.peopleReference == []) {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40 }}>No nearby people were found</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }} onPress={() => this.handleSharePress()}>This app is more fun with more people around.<Text style={{ color: Colors.mayaBlue }}> Share with your friends</Text></Text>
                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_NO_INTERNET') {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }}>No internet connection. Please turn on wi-fi or cellular.</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />
                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_LOCATION') {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40 }}>Could not get your location</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />
                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_LOCATION_PERMISSION_DENIED') {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }}>Location permission was denied. Please grant location permission to use the app</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />
                    </View>
                )
            }

            else if (this.state.errorMessage == 'ERR_ASYNC_STORAGE') {
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }}>Oh Snap! This was a serious error. Did you setup your profile? If not, then please reinstall the app.</Text>
                        <Button
                            title='Retry'
                            onPress={() => this.mainRetry()}
                            type='solid'
                            titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                            containerStyle={{ width: '60%' }}
                            buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                            disabledStyle={{ backgroundColor: 'grey' }} />
                    </View>
                )
            }
        }

        return (
            <View style={{ flex: 1 }}>

                <CardStack
                    style={{ alignItems: 'center', flex: 1 }}
                    renderNoMoreCards={() => this.renderNoMoreCards()}
                    ref={swiper => { this.state.swiper = swiper }}
                    verticalSwipe={false}
                    secondCardZoom={0.80}
                    outputRotationRange={['-20deg', '0deg', '20deg']}
                    onSwiped={(index) => {
                        this.setState({ currentPerson: index })
                        if (index == this.state.people.length - 1)
                            this.setState({ getMoreDisabled: false });
                    }}
                    horizontalThreshold={this.SCREEN_WIDTH * 0.25}>

                    {this.state.people.map((person, index) => (
                        <Card
                            key={index}
                            style={{ width: this.SCREEN_WIDTH, height: this.SCREEN_HEIGHT*0.75 }}
                            onSwipedRight={() => {
                                this.handleRightSwipe(person.path_to_document);
                            }}>
                            <ImageBackground source={{ uri: person.avatar_url }} style={{ flex: 1, width: null, height: null, justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'column' }} resizeMode='cover' resizeMethod='scale' fadeDuration={500}>

                                <LinearGradient colors={['transparent', 'black']} style={{ padding: 10, width: '100%', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>

                                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'white', textAlign: 'center' }}>{person.name}<Text style={{ fontSize: 16, color: Colors.greyLight }}> {person.age}</Text></Text>

                                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 14, color: 'white', textAlign: 'center' }}>{person.job}</Text>

                                    <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 14, color: 'white', textAlign: 'center' }}>{person.company}</Text>

                                </LinearGradient>
                            </ImageBackground>

                        </Card>
                    ))}

                </CardStack>

                <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row', zIndex: 1000 }}>

                    <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.dislikeRed }}>NOPE</Text>

                    <Icon type='material-community' name='close' size={24} color={Colors.dislikeRed} raised reverse onPress={() => {
                        if (this.state.getMoreDisabled)
                            this.state.swiper.swipeLeft();
                        if (this.state.currentPerson == 0)
                            ToastAndroid.show('Swipe left to dislike!', ToastAndroid.SHORT)
                    }} />


                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>

                        <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.reloadYellow }}>BACK</Text>

                        <Icon type='material-community' name='refresh' size={20} color={Colors.reloadYellow} raised reverse onPress={() => {
                            if (this.state.getMoreDisabled)
                                this.state.swiper.goBackFromTop();
                        }} />

                    </View>


                    <Icon type='material-community' name='heart-outline' size={24} color={Colors.likeGreen} raised reverse onPress={() => {
                        if (this.state.getMoreDisabled)
                            this.state.swiper.swipeRight();
                        if (this.state.currentPerson == 0)
                            ToastAndroid.show('Swipe right to like!', ToastAndroid.SHORT)
                    }} />

                    <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.likeGreen }}>LIKE</Text>

                </View>
                
            </View>

        );
    }
}