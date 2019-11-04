import React, { Component } from 'react';
import { BackHandler, Text } from 'react-native';
import { Actions } from 'react-native-router-flux';
import * as Colors from '../assets/Colors';

import Main from './BottomNavScreens/Main';
import Matches from './BottomNavScreens/Matches';
import ChatPeople from './BottomNavScreens/ChatPeople';
import Settings from './BottomNavScreens/Settings';
import { Icon } from 'react-native-elements';
import { BottomNavigation } from 'react-native-paper';

export default class BottomNavigator extends Component {

    constructor() {
        super();
        this.state = {
            index: 0,
            routes: [
                { key: 'main', title: 'Discover', color: Colors.headerGrey },
                { key: 'matches', title: 'Matches', color: Colors.headerGrey },
                { key: 'chat', title: 'Chat', color: Colors.headerGrey },
                { key: 'settings', title: 'Settings', color: Colors.headerGrey }
            ]
        }
    }

    handleIndexChange = index => {
        this.setState({ index });
    };
    
    MainRoute = () => <Main/>;

    renderScene = BottomNavigation.SceneMap({
        main: this.MainRoute,
        matches: Matches,
        chat: ChatPeople,
        settings: Settings
    });

    renderIcon(props) {

        let icon = null

        const key = props.route.key;
        switch (key) {
            case 'main':
                props.focused ? icon = <Icon type='material-community' name='magnify' size={26} color='black' /> : icon = <Icon type='material-community' name='magnify' size={24} color={Colors.greyDark} />
                break;
            case 'matches':
                props.focused ? icon = <Icon type='material-community' name='account-multiple' size={26} color='black' /> : icon = <Icon type='material-community' name='account-multiple' size={24} color={Colors.greyDark} />
                break;
            case 'chat':
                props.focused ? icon = <Icon type='material-community' name='chat' size={26} color='black' /> : icon = <Icon type='material-community' name='chat' size={24} color={Colors.greyDark} />
                break;
            case 'settings':
                props.focused ? icon = <Icon type='material-community' name='settings' size={26} color='black' /> : icon = <Icon type='material-community' name='settings' size={24} color={Colors.greyDark} />
                break;
            default:
                props.focused ? icon = <Icon type='material-community' name='help-circle' size={26} color='black' /> : icon = <Icon type='material-community' name='help-circle' size={24} color={Colors.greyDark} />
        }
        return icon;
    }

    backHandler = null;

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (Actions.currentScene == 'bottomNavigator')
                BackHandler.exitApp();
        });
    }

    render() {
        return (
            <BottomNavigation
                navigationState={this.state}
                onIndexChange={this.handleIndexChange}
                renderScene={this.renderScene}
                shifting={true}
                labeled={false}
                renderIcon={(props) => this.renderIcon(props)}
            />
        )
    }
    componentWillUnmount() {
        this.backHandler.remove();
    }
}