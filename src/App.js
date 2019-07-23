import React, { Component } from 'react';
import {render} from 'react-dom';
import Lobby from './Lobby';


export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username:'',
            passWord:'',
            socket: io(),
            checked: false,
            winned:'',
            played:'',
            uid:'',
            rooms: new Map(),
        }
        this.ready();
    }

    usernameChange(e) {
        this.setState({username: e.target.value})
    }

    passWordChange(e) {
        this.setState({passWord: e.target.value})
    }

    handleKeyPress(e) {
        if (e.key == 'Enter') {
            this.handleLogin()
        }
        return false;
    }

    handleClick(e) {
        let c = this.checkValid();
        if(c) {
            if(e.target.id === 'loginBtn') {
                this.handleLogin();
            } else if(e.target.id === 'RegisterBtn') {
                this.handleRegister();
            }
        } else {
            return;
        }

    }

    generateUid() {
        return new Date().getTime()+""+Math.floor(Math.random()*10+1);
    }

    checkValid(){
        let c = true;
        let username = this.state.username;
        let passWord = this.state.passWord;
        if(username === '') {
            alert('Please insert username');
            c = false;
        }
        if(passWord === '') {
            alert('Please insert password');
            c = false;
        }
        return c;
    }

    handleLogin() {
        let uid = this.generateUid();
        this.setState({uid: uid});
        let username = this.state.username;
        let passWord = this.state.passWord;
        this.state.socket.emit('login', {uid: uid,username:username, passWord:passWord})
    }

    handleRegister() {
        let uid = this.generateUid();
        this.setState({uid: uid});
        let username = this.state.username;
        let passWord = this.state.passWord;
        this.state.socket.emit('register', {uid: uid,username:username, passWord:passWord})
    }

    handleLougut() {
        let uid = this.state.uid;
        this.state.socket.emit('logout', {uid: uid});
        this.setState({
            username:'',
            passWord:'',
            checked: false,
            winned:'',
            played:'',
            uid:''
        });
    }

    ready() {
        const socket = this.state.socket;
        socket.on('login_msg', (o) => {
            if(o.check) {

                this.setState({checked: true, winned: o.winned, played: o.played, rooms: new Map(JSON.parse(o.roomList))})
            } else {
                this.setState({username:'', passWord:'', uid:''});
                alert(o.message);
            }
        });
        socket.on('register_msg', (o) => {
            if(o.check) {
                this.setState({checked: true, winned: 0, played: 0, rooms: new Map(JSON.parse(o.roomList)) })
            } else {
                this.setState({username:'', passWord:'', uid:''});
                alert(o.message);
            }
        });
        socket.on('left', (o) => {

        })
    }



    render() {
        let renderDOM;
        if (this.state.checked) {
            //append Lobby if usename exists
            renderDOM = (
                    <div className = "test">
                        <div>
                            <Lobby uid={this.state.uid} username={this.state.username} socket={this.state.socket} rooms = {this.state.rooms}/>
                        </div>
                        <button className="logout" onClick={this.handleLougut.bind(this)}>Log out</button>
                    </div>
                )
        } else {
            // append login elements if there is no user
            renderDOM = (<div className="login-box">
                <h2>login</h2>
                <div className="input">
                    <input type="text" placeholder="Username" onChange={this.usernameChange.bind(this)}
                           onKeyPress={this.handleKeyPress.bind(this)} value={this.state.username}/>
                    <input type="text" placeholder="Pass Word" onChange={this.passWordChange.bind(this)}
                           onKeyPress={this.handleKeyPress.bind(this)} value={this.state.passWord}/>
                </div>
                <div className="submit">
                    <button type="button" id="loginBtn" onClick={this.handleClick.bind(this)} >login</button>
                    <button type="button" id="RegisterBtn" onClick={this.handleClick.bind(this)} >register</button>
                </div>
            </div>)
        }
        return (<div>{renderDOM}</div>)
    }
}