import React, { Component } from 'react';
import {render} from 'react-dom';
import GameRoom from './GameRoom';

class CreateRoom extends React.Component {
    constructor(props) {
        super(props);
        const socket= this.props.socket;
        this.state = {
            roomName:'',
            socket: socket,
            isPri: false,
            roomPass: '',
            username: this.props.username,
            uid: this.props.uid
        };
    }

    roomNameChange(e) {
        this.setState({roomName:e.target.value});
    }
    privateChange(e) {
        this.setState({isPri:e.target.checked});
    }
    roomPassChange(e) {
        this.setState({roomPass:e.target.value});
    }
    createRm(e) {
        const roomName = this.state.roomName;
        let isPri = this.state.isPri;
        let roomPass = this.state.roomPass;
        let socket = this.state.socket;
        let username = this.state.username;
        let uid = this.state.uid;
        if(roomName == '') {
            alert("the room must have a name");
        }else if(isPri && !roomPass) {
            alert("Private room needs password")
        } else if (!isPri && roomPass) {
            alert("public room does not have password")
        } else {
            socket.emit('create-room', {roomName: roomName, isPri: isPri, roomPass: roomPass, uid: uid});
        }
    }

    render() {
        return(
            <div className="create-room">
                <h4>Create a new Room</h4>
                <input type="text" placeholder="roomName" onChange={this.roomNameChange.bind(this)}
                       value={this.state.roomName}/><br/>
                <input type="checkbox"  onChange={this.privateChange.bind(this)}/><br/>
                <input type="text" placeholder="roomPass" onChange={this.roomPassChange.bind(this)}
                       value={this.state.roomPass}/><br/>
                <button type="button" id="createRoomBtn" onClick={this.createRm.bind(this)} >Create Room</button>
            </div>
        )
    }
}


export default class Lobby extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username:this.props.username,
            socket: this.props.socket,
            winned:this.props.winned,
            isJoined:'',
            played:this.props.played,
            uid:this.props.uid,
            room:[],
            rooms:this.props.rooms,
            onlineUsers:[],
            onlineCount:''
        }
        this.ready();
    }

    Logout(e) {
        return;
    }

    ready() {
        const socket = this.state.socket;
        const uid = this.state.uid;
        socket.emit("enter", {uid: uid});
        socket.on('create-room-res', (o) => {
            this.setState({
                isJoined : true,
                room: o.roomInfo
            });
        });
        socket.on('update-rooms', (o) => {
            this.setState({
                rooms: new Map(JSON.parse(o.roomList))
            });

        });
        socket.on('update-users', (o)=>{
           this.setState({
               onlineUsers: o.onlineUsers
           })
        });
        socket.on('join-room-res', (o)=>{
            if(o.check) {
                this.setState({
                    isJoined: true,
                    room: o.roomInfo
                });
            }
        });

        socket.on('goLobby', (o)=>{
            this.setState({
                isJoined: false,
            });
        });

        socket.on('left', (o)=>{
            this.setState({
                onlineUsers: o.onlineUsers,
                onlineCount: o.onlineCount,
                rooms: new Map(JSON.parse(o.roomList))
            })
        });

    }

    showRoom() {
        let roomsDom = [];
        let rooms = this.state.rooms;
        const onlineUsers = this.state.onlineUsers;
        for (let[roomId, roomInfo] of rooms ) {
            let roomName = roomInfo[1];
            let isPri = roomInfo[2]? "Yes" : "No";
            let player1 = onlineUsers[roomInfo[4]];
            let player2 = onlineUsers[roomInfo[5]]
            let action = [];
            action.push(
                <button onClick={()=>this.handle_join(roomId)}>Join</button>
            );

            roomsDom.push(
                <tr>
                    <td>{roomName}</td>
                    <td>{isPri}</td>
                    <td>{player1}</td>
                    <td>{player2}</td>
                    <td>{action}</td>
                </tr>
            )
        }
        return roomsDom;
    }

    handle_join(roomId) {
        const oneRoom = this.state.rooms.get(roomId);
        const socket = this.state.socket;
        const uid = this.state.uid;
        let roomPass = ''
        if (oneRoom[2]) {
            let roomPass = prompt("Please input password of this room", "");
        }
        socket.emit("join-room", {roomId: roomId, isPri:oneRoom[2], roomPass:roomPass, uid: uid});

    }



    render() {
        let renderDOM;
        if (this.state.isJoined) {
            renderDOM = <GameRoom  uid={this.state.uid} username={this.state.username} socket={this.state.socket} roomInfo={this.state.room}/>
        } else {
            // append login elements if there is no user
            renderDOM = (
                <div className="lobby-box">
                    <h2>Lobby</h2>

                    <div className="roomList">
                        <table>
                            <thead>
                            <tr>
                                <th>roomName</th>
                                <th>private</th>
                                <th>player1</th>
                                <th>player2</th>
                                <th>operation</th>
                            </tr>
                            </thead>
                            <tbody>
                            {this.showRoom()}
                            </tbody>
                        </table>
                    </div>
                    <div className="create-room">
                        <CreateRoom uid={this.state.uid} socket={this.state.socket} username ={this.state.username}/>
                    </div>

                </div>
            )
        }
        return (<div>{renderDOM}</div>)
    }
}
