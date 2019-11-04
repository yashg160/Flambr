import React, { Component } from 'react';
import { Router, Scene, Stack } from 'react-native-router-flux';
import { Provider as PaperProvider } from 'react-native-paper';

import Home from './screens/Home';
import Register from './screens/Register';
import SignIn from './screens/SignIn';
import RegisterCode from './screens/RegisterCode';
import SignInCode from './screens/SignInCode';
import PinSignIn from './screens/PinSignIn';
import PinRegister from './screens/PinRegister';
import ProfileSetup from './screens/ProfileSetup';
import AvatarPreview from './screens/AvatarPreview';
import MatchPerson from './screens/BottomNavScreens/MatchPerson';
import Chat from './screens/BottomNavScreens/Chat';
import EditProfile from './screens/BottomNavScreens/EditProfile';
import BottomNavigator from './screens/BottomNavigator';

const App = () => {
  return (
    <PaperProvider>
      <Router>
        <Stack>
          <Scene key='home' component={Home} title='Home' hideNavBar={true} />
          <Scene key='register' component={Register} title='Register' hideNavBar={true} />
          <Scene key='signIn' component={SignIn} title='Sign In' hideNavBar={true} />
          <Scene key='registerCode' component={RegisterCode} title='Verify Code' hideNavBar={true} />
          <Scene key='pinRegister' component={PinRegister} title='Security' hideNavBar={true} />
          <Scene key='signInCode' component={SignInCode} title='Verify Code' hideNavBar={true} />
          <Scene key='pinSignIn' component={PinSignIn} title='Security' hideNavBar={true} />
          <Scene key='profileSetup' component={ProfileSetup} title='Profile' hideNavBar={true} /> 
          <Scene key='avatarPreview' component={AvatarPreview} title='Preview' hideNavBar={true} /> 
          <Scene key='matchPerson' component={MatchPerson} title='Matched Person' hideNavBar={true} /> 
          <Scene key='chat' component={Chat} title='Chat' hideNavBar={true} />
          <Scene key='editProfile' component={EditProfile} title='Edit Profile' hideNavBar={true} />
          <Scene key='bottomNavigator' component={BottomNavigator} title='Bottom Navigator' hideNavBar={true} />
        </Stack>
      </Router>
    </PaperProvider>
  )
}

export default App;