import React, { Component } from 'react';
import { ImageBackground, Text, View, Dimensions } from 'react-native';
import { Icon } from 'react-native-elements';
import { Header } from 'react-native-elements'
import { Actions } from 'react-native-router-flux';
import * as Colors from '../assets/Colors';
import LinearGradient from 'react-native-linear-gradient';

export default class AvatarPreview extends Component {

    SCREEN_HEIGHT = Dimensions.get('window').height;
    SCREEN_WIDTH = Dimensions.get('window').width;

    //TODO: Icons bug. Fix by checking.

    render() {
        return (
            <View style={{ height: this.SCREEN_HEIGHT, width: this.SCREEN_WIDTH }}>
                <Header
                    placement='center'
                    leftComponent={<Icon type='material' name='chevron-left' color={Colors.primary} size={32} onPress={() => Actions.pop()} />}
                    centerComponent={{ text: 'Preview', style: { fontFamily: 'comfortaa.bold', color: 'black', fontSize: 24 } }}
                    backgroundColor={Colors.headerGrey} />

                <ImageBackground
                    source={{ uri: this.props.avatar_url }}
                    style={{
                        width: this.SCREEN_WIDTH,
                        height: this.SCREEN_HEIGHT * 0.60,
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}
                    resizeMode='cover'
                    resizeMethod='scale'
                    fadeDuration={500}>

                    <LinearGradient colors={['transparent', 'black']} style={{ paddingBottom: 10, width: '100%', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 24, color: 'white', textAlign: 'center' }}>Your Name<Text style={{ fontSize: 16, color: Colors.greyLight }}> 20</Text></Text>

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 14, color: 'white', textAlign: 'center' }}>Job</Text>

                        <Text style={{ fontFamily: 'comfortaa.regular', fontSize: 14, color: 'white', textAlign: 'center' }}>Workplace</Text>

                    </LinearGradient>

                </ImageBackground>

                <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row', zIndex: 1000, marginTop: 20 }}>

                    <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.dislikeRed }}>NOPE</Text>

                    <Icon type='material-community' name='close' size={24} color={Colors.dislikeRed} raised reverse />


                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>

                        <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.reloadYellow }}>BACK</Text>

                        <Icon type='material-community' name='refresh' size={20} color={Colors.reloadYellow} raised reverse />

                    </View>


                    <Icon type='material-community' name='heart-outline' size={24} color={Colors.likeGreen} raised reverse />

                    <Text style={{ fontFamily: 'comfortaa.bold', fontWeight: '200', fontSize: 12, color: Colors.likeGreen }}>LIKE</Text>

                </View>

            </View>
        )
    }
}