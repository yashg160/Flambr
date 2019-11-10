import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import React, { Component } from 'react';
import { View, ActivityIndicator } from 'react-native';
import database, {firebase} from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-community/async-storage';
import { Header } from 'react-native-elements';
import * as Colors from '../../assets/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';
import { Actions } from 'react-native-router-flux';

export default class Chat extends Component {

    state = {
        messages: [],
        uid: '',
        name: '',
        uniRef: null,
        userAvatar: '',
        personName: 'John Doe',
        loading: true,
        image: null,
        sendingImage: false
    };
    messagesRef = null;

    TAG = 'Chat Screen: ';

    async setUid() {
        const value = await AsyncStorage.getItem('USER_DOC_REF');
        this.setState({ uid: value });
        return;
    }

    async getUserAvatar() {
        try {
            const userAvatar = await AsyncStorage.getItem('AVATAR_URL');
            this.setState({ userAvatar });
        }
        catch (error) {
            console.log(this.TAG, 'Error in getting avatar url', error);
            throw Error();
        }
        return;
    }

    async setName() {
        let value = await AsyncStorage.getItem('USER_NAME');
        if (!value) {
            value = 'Your Name';
            this.setState({ name: value });
            return;
        }
        console.log(this.TAG, 'Name value: ', value);
        this.setState({ name: value });
        return;
    }

    async setRef() {
        console.log(this.TAG, 'setRef called');
        let userNumber = this.state.uid.split('/')[3];
        let personNumber = this.props.person.phoneNumber;

        let slicePerson = personNumber.slice(3, 8);
        let sliceUser = userNumber.slice(3, 8);

        const k1 = Number(slicePerson);
        const k2 = Number(sliceUser);

        const uniRef = (k1 + k2) * (k1 + k2 + 1) / 2 + k2;
        this.setState({ uniRef });

        console.log(this.TAG, 'Numbers are: ', k1, k2, uniRef);
        return;
    }

    loadMessages(callback) {
        const { uniRef } = this.state;

        this.messagesRef = database().ref(`messages-${uniRef}`);
        this.messagesRef.off();

        const onReceive = (data) => {
            const message = data.val();
            callback({
                _id: data.key,
                text: message.text,
                createdAt: new Date(message.createdAt),
                user: {
                    _id: message.user._id,
                    name: message.user.name,
                    avatar: message.avatar
                },
                image: message.image,
                messageType: message.messageType
            });
        };
        this.messagesRef.limitToLast(20).on('child_added', onReceive);
        return;

    }

    //Send message to the backend
    sendMessage = (message) => {
        console.log(this.TAG, message);
        for (let i = 0; i < message.length; i++) {
            this.messagesRef.push({
                text: message[i].text,
                user: message[i].user,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }

    sendImageMessage(message) {
        console.log(this.TAG, 'sendImageMessage called', message);

        this.messagesRef.push({
            text: message.text,
            user: message.user,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            image: message.image,
            messgageType: 'image'
        });

        this.setState({ sendingImage: false });
    }

    //Close the conenction to the database
    async closeChat() {
        if (this.messagesRef) {
            await this.messagesRef.off();
        }
    }


    //Methods to handle sending pictures
    async uploadPicture(path) {
        console.log(this.TAG, 'uploadImage called');

        const id = this.imageIdGenerator();
        await storage().ref(`images/${id}`).putFile(path)
            .then(success => {
                console.log(this.TAG, 'Image uploaded successfully');
            });
        let url = null;
        await storage().ref(`images/${id}`).getDownloadURL()
            .then(picUrl => {
                console.log(this.TAG, 'Image url:', picUrl);
                url = picUrl;
            });
        return url;
    }

    imageIdGenerator() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    handleAddPicture() {
        console.log(this.TAG, 'handleAddPicture called');

        //First have the user select an image from the phone. Cropping is allowed
        ImagePicker.openPicker({
            freeStyleCropEnabled: true,
            cropping: true,
            cropperActiveWidgetColor: Colors.primary,
            cropperStatusBarColor: Colors.primary,
            cropperToolbarColor: Colors.primary,
            mediaType: 'photo',
            compressImageQuality: 0.2
        }).then(image => {
            if (image !== null) {
                this.setState({ image, sendingImage: true });

                const { path } = image;

                //Now upload this picture to firebase storage
                this.uploadPicture(path)
                    .then((url) => {
                        //url contains the download url for this picture. Create the message to be sent

                        const message = {
                            text: null,
                            user: {
                                _id: this.state.uid,
                                name: this.state.name,
                                avatar: this.state.userAvatar,
                            },
                            image: url,
                            messgageType: 'image'
                        };
                        console.log(this.TAG, message);
                        this.sendImageMessage(message);
                    })
                    .catch(error => { console.log(this.TAG, error); return; });

            }
        })
            .catch(error => { console.log(this.TAG, 'Picture selection cancelled', error) });
    }


    //Rest of all lifecycle methods
    componentDidMount() {
        firebase.database().setPersistenceEnabled(true);
        firebase.database().setPersistenceCacheSizeBytes(10000000);
        //Set the name in state for the header
        const personName = this.props.person.name;
        this.setState({ personName });

        this.setUid()
            .then(() => this.getUserAvatar())
            .then(() => this.setName())
            .then(() => this.setRef())
            .then(() => this.loadMessages(message => {
                this.setState((previousState) => {
                    return {
                        messages: GiftedChat.append(previousState.messages, message)
                    }
                });
                this.setState({ loading: false });
            }));
    }

    renderBubble = props => {
        return (

            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: Colors.primary,
                    },
                    left: {
                        backgroundColor: Colors.greyLight
                    }
                }}
                textStyle={{
                    left: {
                        color: 'black',
                        fontFamily: 'comfortaa.regular',
                        fontWeight: '400'
                    },
                    right: {
                        color: 'white',
                        fontFamily: 'comfortaa.regular',
                        fontWeight: '400'
                    }
                }}
            />
        )
    }

    render() {
        if (this.state.loading) {
            return (
                <ActivityIndicator size='large' color={Colors.primary} style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            )
        }

        return (
            <View style={{ flex: 1 }}>
                <Header
                    placement='center'
                    centerComponent={{ text: this.state.personName, style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 24 } }}
                    containerStyle={{ backgroundColor: Colors.headerGrey }}
                    leftComponent={<Icon name='chevron-left' color={Colors.primary} size={32} onPress={() => Actions.pop()} />}
                    rightComponent={this.state.sendingImage ? <ActivityIndicator size={22} color={Colors.secondaryDark} style={{ marginRight: 10 }} /> : <Icon name='photo-camera' color='black' size={26} onPress={() => this.handleAddPicture()} />} />
                <GiftedChat
                    isAnimated={true}
                    renderLoading={() => <ActivityIndicator size='large' style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} color={Colors.primary} />}
                    isLoadingEarlier={true}
                    renderUsernameOnMessage={true}
                    renderBubble={(props) => this.renderBubble(props)}
                    messages={this.state.messages}
                    onSend={message => this.sendMessage(message)}
                    user={{
                        _id: this.state.uid,
                        name: this.state.name,
                        avatar: this.state.userAvatar
                    }}
                    textInputProps={
                        style = {
                            fontFamily: 'comfortaa.regular',
                            fontSize: 18,
                            borderColor: Colors.primary
                        }
                    }
                />
            </View>

        );
    }

    componentWillUnmount() {
        this.closeChat()
            .then(() => console.log(this.TAG, 'Chat closed'))
            .catch(error => console.log(this.TAG, error));


    }
}