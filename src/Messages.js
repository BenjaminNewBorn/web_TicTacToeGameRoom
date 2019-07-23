import React, { Component } from 'react';
import {render} from 'react-dom';


export default class Messages extends Component {
    constructor(props) {
        super(props);
        const socket = this.props.socket;
        this.state = {
            socket: socket,
            messages:[],
            message:''
        }
        this.ready();
    }

    ready() {
        const socket = this.state.socket;

        socket.on('message_to_client', (o) => {
            this.updateMsg(o, 'message_to_client')
        });
    }

    updateMsg(o, action) {
        let messages = this.state.messages;
        const newMsg = {message: 'message'}
        messages = messages.concat(newMsg);
        this.setState ({
            messages: messages
        });
    }


    handleClick(e) {
        this.sendMessage();
    }

    handleChange(e) {
        this.setState ({message: e.target.value});
    }

    handleKeyPress(e) {
        if (e.key == 'Enter') {
            this.sendMessage();
        }
        return false;
    }

    sendMessage(e){
        const message = this.state.message;
        const socket = this.state.socket;
        alert(message);
        if(message) {
            const obj = {
                message: message
            }
            socket.emit('message_to_server', obj);
            this.setState({message: ''});
        }
        return false;

    }
    render() {

        return (
            <div className="input-box">
                <div>
                    <input type="text" maxLength="140" placeholder="message" value={this.state.message}
                           onKeyPress={this.handleKeyPress.bind(this)} onChange={this.handleChange.bind(this)}/>
                </div>
                <div className="button">
                    <button className="button" onClick={this.handleClick.bind(this)}>
                        Send message
                    </button>
                </div>
            </div>
        );
    }
}