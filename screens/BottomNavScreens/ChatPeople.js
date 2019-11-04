import React, { Component } from 'react';
import { Text, View, ActivityIndicator, FlatList, ToastAndroid, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import { ListItem, Header, Divider, Button, CheckBox } from "react-native-elements";
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Colors from '../../assets/Colors';
import { Actions } from 'react-native-router-flux';

export default class ChatPeople extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            errorMessage: 'ERR_UNKNOWN',
            matchedPeopleData: [],
            modalVisible: true,
            notShowAgain: true
        }
    }

    TAG = 'Chat People Screen:';

    async checkInternet() {
        const status = await NetInfo.fetch();

        if (!status.isConnected) {
            this.setState({ errorMessage: 'ERR_NO_INTERNET'})
            throw Error();
        }
    }

    async getUserDocument() {
        console.log(this.TAG, 'getUserDocument called');
        const userDocumentReference = await AsyncStorage.getItem('USER_DOC_REF', null);
        if (userDocumentReference == null) {
            this.setState({ errorMessage: 'ERR_NULL_USER_REF' });
            throw Error();
        }
        else {
            return userDocumentReference;
        }
    }

    async getMatchedPeopleReferences(userDocumentReference) {
        console.log(this.TAG, 'getMatchedPeople called');

        //userDocumentReference was passed in from the last then method
        //This is a a QuerySnapshot object
        const matchedPeopleRefsSnapshot = await firestore().doc(userDocumentReference).collection('liked_by_people').where('match', '==', true).get();
        if (matchedPeopleRefsSnapshot.empty) {
            this.setState({ errorMessage: 'ERR_NO_PEOPLE' });
            throw Error()
        }
        else
            return matchedPeopleRefsSnapshot.docs; //Returns an array of DocumentSnapshots
    }

    async getDataFromReferences(docsArray) {
        console.log(this.TAG, 'getDataFromReferences called');

        //In this method, docsArray is an array of DocumentSnapshots. Each snapshot contains the path to document for the matched person
        //For each reference, read the database and get the name, avatarUrl and phoneNumber

        let references = [];

        await docsArray.map((docSnapshot) => {
            var ref = docSnapshot.get('path_to_document');
            references.push(ref)
        });

        for (var i = 0; i <= references.length - 1; i++) {
            const ref = references[i];

            let dataObject = {
                name: null,
                avatar: null,
                phoneNumber: null
            };

            //personData contains all the data fields of the person. DocumentSnaphot
            const personData = await firestore().doc(ref).get();

            if(personData != null) {
                //Now push the required fields into the object to be returned
                dataObject.name = await personData.get('name');
                dataObject.avatar = await personData.get('avatar_url');

                dataObject.phoneNumber = await ref.split('/')[3];

                this.state.matchedPeopleData.push(dataObject);
            }
        }

        return;
    }

    async getModalVisible() {
        const modal = await AsyncStorage.getItem('MODAL', null);

        if (modal == 'false' || modal == null)
            this.setState({ modalVisible: false });
        else
            this.setState({ modalVisible: true });
    }

    handleAvatarPress() {
        ToastAndroid.show('Functionality will be added in next update', ToastAndroid.LONG);
    }

    handleCheckPress() {
        const checked = this.state.notShowAgain;
        checked ? this.setState({ notShowAgain: false }) : this.setState({ notShowAgain: true });
    }

    handleModalClose() {
        try {
            if (this.state.notShowAgain) {
                AsyncStorage.setItem('MODAL', 'false')
            }
            else {
                AsyncStorage.setItem('MODAL', 'true')
            }
            this.setState({ modalVisible: false });
        }
        catch (error) {
            ToastAndroid.show('An error occurred', ToastAndroid.SHORT);
        }
    }

    componentDidMount() {
        
        this.checkInternet()
            .then(() => this.getModalVisible())
            .then(() => this.getUserDocument())
            .then((userDocRef) => this.getMatchedPeopleReferences(userDocRef))
            .then((docsArray) => this.getDataFromReferences(docsArray))
            .then(() => {
                //No error and all promises returned successfully
                this.setState({ loading: false, error: false});
            })
            .catch((error) => {
                this.setState({ error: true, loading: false });
                console.log(this.TAG, error);
            });

    }

    retry() {
        this.checkInternet()
            .then(() => this.getModalVisible())
            .then(() => this.getUserDocument())
            .then((userDocRef) => this.getMatchedPeopleReferences(userDocRef))
            .then((docsArray) => this.getDataFromReferences(docsArray))
            .then(() => {
                //No error and all promises returned successfully
                this.setState({ loading: false, error: false});
            })
            .catch((error) => {
                this.setState({ error: true, loading: false });
                console.log(this.TAG, error);
            });
    }

    retryNoPeople() {
        this.getUserDocument()
            .then((userDocRef) => this.getMatchedPeopleReferences(userDocRef))
            .then((docsArray) => this.getDataFromReferences(docsArray))
            .then(() => {
                //No error and all promises returned successfully
                this.setState({ loading: false, error: false});
            })
            .catch((error) => {
                this.setState({ error: true, loading: false });
                console.log(this.TAG, error);
            });
    }

    render() {
        if (this.state.loading) {
            return (
                <ActivityIndicator size='large' style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} color={Colors.primary} />
            )
        }

        else {
            if (this.state.error) {
                const { errorMessage } = this.state;
                if (errorMessage == 'ERR_NULL_USER_REF') {
                    ToastAndroid.show('A fatal error occurred', ToastAndroid.LONG);
                    return (
                        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40}}>
                            <Text style={{fontFamily: 'comfortaa.regular', fontSize: 18, color: 'black', textAlign: 'center'}}>Oh Snap! A fatal error occurred. Did you setup your profile? Try reinstalling the app</Text>
                        </View>
                    )
                }
                else if (errorMessage == 'ERR_NO_PEOPLE') {
                    ToastAndroid.show('No matched people', ToastAndroid.SHORT);
                    return (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                            <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'black', textAlign: 'center' }}>Looks like no one has right swiped you. Wait for it.</Text>
                            <Button
                                title='Retry'
                                onPress={() => this.retryNoPeople()}
                                type='solid'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                                containerStyle={{ width: '60%' }}
                                buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                                disabledStyle={{ backgroundColor: 'grey' }} />
                            
                            <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'black', textAlign: 'center' }}>Patience is a virtue</Text>
                        </View>
                    )
                }
                else if (errorMessage == 'ERR_NO_INTERNET') {
                    ToastAndroid.show('No internet connection', ToastAndroid.LONG);
                    return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', paddingHorizontal: 40, textAlign: 'center' }}>No internet connection. Please turn on wi-fi or cellular.</Text>
                            <Button
                                title='Retry'
                                onPress={() => this.retry()}
                                type='solid'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                                containerStyle={{ width: '60%' }}
                                buttonStyle={{ borderRadius: 50, marginTop: 20, backgroundColor: Colors.primary }}
                                disabledStyle={{ backgroundColor: 'grey' }} />
                        </View>
                    )
                }
                else {
                    ToastAndroid.show('An error occurred', ToastAndroid.SHORT)
                    return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>

                            <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular' }}>An unknown error occurred</Text>

                            <Button
                                title='Retry'
                                onPress={() => this.retry()}
                                type='solid'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 16 }}
                                containerStyle={{ width: '60%' }}
                                buttonStyle={{ borderRadius: 50, marginVertical: 24, backgroundColor: Colors.primary }}
                                disabledStyle={{ backgroundColor: 'grey' }} />

                            <Text style={{ fontSize: 16, color: 'black', fontFamily: 'comfortaa.regular', textAlign: 'center' }}>Try restarting the app</Text>

                        </View>
                    )
                }
            }

            return (
                <View>
                    <Header
                        placement='center'
                        leftComponent={{ text: 'Messages', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 29 } }}
                        leftContainerStyle={{ flex: 1, paddingLeft: 10 }}
                        centerContainerStyle={{ flex: 0, height: 0, width: 0 }}
                        rightContainerStyle={{ flex: 0, height: 0, width: 0 }}
                        containerStyle={{ backgroundColor: Colors.headerGrey }} />
                    <FlatList
                        data={this.state.matchedPeopleData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View>
                                <ListItem
                                    roundAvatar
                                    title={item.name}
                                    leftAvatar={{ source: { uri: item.avatar }, size: 'medium', containerStyle: { marginLeft: 20, borderWidth: 2, borderColor: Colors.primary }, renderPlaceholderContent: <Icon name='person' color='grey' size={24} />, onPress: this.handleAvatarPress }}
                                    onPress={() => Actions.push('chat', { person: item })}
                                    contentContainerStyle={{ padding: 10 }}
                                    titleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 18, marginBottom: 5 }}
                                    subtitleStyle={{ fontFamily: 'comfortaa.bold', color: 'black', fontSize: 16 }}
                                    chevron={<Icon name='chevron-right' type='material' size={24} color={Colors.primary} />}
                                    containerStyle={{ padding: 10 }} />
                                <Divider style={{ backgroundColor: Colors.headerGrey, height: 1, width: '75%', alignSelf: 'flex-end', marginRight: 5 }} />
                            </View>
                        )}
                    />

                    <Modal
                        visible={this.state.modalVisible}
                        animationType='fade'
                        hardwareAccelerated={true}
                        transparent={true}
                        onRequestClose={() => {
                            this.setState({ modalVisible: false });
                            this.handleModalClose()
                        }}
                    >

                        <View style={{ flex: 1, paddingTop: 40, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 40, alignItems: 'center' }}>

                            <ScrollView style={{ flex: 1 }} persistentScrollbar={true} indicatorStyle='white'>
                                <Text style={{ fontFamily: 'comfortaa.bold', fontSize: 28, color: 'white', fontWeight: '200' }}>
                                    A Note
                                </Text>

                                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'white', fontWeight: '100', marginTop: 20 }}>
                                    Hello there! This is development team of <Text style={{ color: Colors.primary }}>Flambr</Text>. We hope that you are having fun dating and meeting new people.
                                    We certainly had fun developing this app. We would like a few seconds to discuss some things.
                                </Text>

                                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'white', fontWeight: '100', marginTop: 20, marginBottom: 20 }}>
                                    This app is still in its early stages. Its primary focus is to bring people together. Chatting is not the primary function of this app.
                                    You might experience some loading times when you open this screen. This is because <Text style={{ color: Colors.primary }}>Flambr</Text> is not intended to be used as a regular chatting app.
                                </Text>

                                <Divider style={{ width: '100%', height: 2, backgroundColor: Colors.primary }} />

                                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'white', fontWeight: '100', marginTop: 10, marginBottom: 10 }}>
                                    We suggest you to use our chat functionality to exchange phone numbers and use another chat app to communicate further.
                                We plan to introduce a full fleshed chat functionality later in the app. For now, we hope that you understand.
                                </Text>

                                <Divider style={{ width: '100%', height: 2, backgroundColor: Colors.primary }} />

                                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'white', fontWeight: '100', marginTop: 20, textAlign: 'center' }}>
                                    Yours sincerely
                                </Text>

                                <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 16, color: 'white', fontWeight: '100', marginTop: 5, textAlign: 'center' }}>
                                    Flambr Development Team
                                </Text>
                            </ScrollView>

                            <CheckBox
                                title='Do not show again'
                                textStyle={{ fontFamily: 'comfortaa.regular', fontSize: 16, fontWeight: '100', color: 'white' }}
                                checked={this.state.notShowAgain}
                                iconType='material-community'
                                checkedIcon='check'
                                uncheckedIcon='crop-square'
                                uncheckedColor='white'
                                containerStyle={{ marginVertical: 20, backgroundColor: 'transparent' }}
                                checkedColor={Colors.primary}
                                onIconPress={() => this.handleCheckPress()}
                                onPress={() => this.handleCheckPress()}
                            />

                            <Button
                                title='Got it'
                                onPress={() => this.handleModalClose()}
                                type='solid'
                                titleStyle={{ fontFamily: 'comfortaa.regular', color: 'white', fontSize: 20 }}
                                containerStyle={{ width: '60%' }}
                                buttonStyle={{ borderRadius: 40, marginVertical: 10, backgroundColor: Colors.primary, marginBottom: 20 }} />
                        </View>

                    </Modal>
                </View>
            )
        }
    }
}