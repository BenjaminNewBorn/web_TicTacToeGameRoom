import React, {Component} from 'react';
import {render} from 'react-dom';
import css from './index.css';
import Messages from './Messages';

function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}





function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i< lines.length; i++) {
        const [a, b , c] = lines[i];
        if(squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}


class Board extends React.Component {
    constructor(props) {
        super(props);
        const socket= this.props.socket;
        this.state = {
            squares: Array(9).fill(null),
            xIsNext: true,
            isMyX:this.props.isMyX,
            socket: socket,
            roomId: this.props.roomId,
            player1:this.props.player1,
            player2:this.props.player2,
            username: this.props.username,
            Ai:false
        };
    }

    handleClick(i) {
        const squares = this.state.squares.slice();
        const start = this.state.start;
        const isMyX = this.state.isMyX;
        const xIsNext = this.state.xIsNext;
        if(!this.state.Ai){
            if(calculateWinner(squares) || squares[i] || start || isMyX !== xIsNext) {
                return;
            }
            squares[i] = this.state.xIsNext ? 'X' : 'O';
            this.setState({
                squares: squares,
                xIsNext: !this.state.xIsNext,
            });
            const socket = this.state.socket;
            socket.emit("sendStep", {squares: squares, roomId: this.state.roomId});
        } else {
            if(calculateWinner(squares) || squares[i]) {
                return;
            }
            squares[i] = this.state.xIsNext ? 'X' : 'O';
            this.setState({
                squares: squares,
                xIsNext: !this.state.xIsNext,
            });
        }

    }



    componentDidMount() {
        const socket = this.state.socket;
        socket.on('nextStep', (o) => {
            const squares = o.squares;
            this.setState({
                squares:squares,
                xIsNext: !this.state.xIsNext
            });

        });
    }

    renderSquare(i) {
        return (
            <Square
                value = {this.state.squares[i]}
                onClick = {() => this.handleClick(i)}
            />
        );
    }
    AIGame(e) {
        this.setState({
            Ai:true
        })
    }
    AI(){
        if (!this.state.xIsNext && this.state.Ai){
            let actions=this.get_passable_action();
            let action=this.get_action(actions);
            this.handleClick(action);
            return null;
        }
    }

    get_action(actions){
        let max=-100;
        let opt_action=actions[0];
        for (let i=0;i<actions.length;i++){
            if(this.action_evaluation(actions[i])>max){
                max=this.action_evaluation(actions[i]);
                opt_action=actions[i];
            }
        }
        return opt_action;
    }
    action_evaluation(i){
        let state_array=this.state.squares;
        state_array[i]="X";
        if(calculateWinner(state_array)){state_array[i]=null;return 50}
        if(this.is_drawn(state_array)){state_array[i]=null;return 10}
        state_array[i]="O";
        if(calculateWinner(state_array)){state_array[i]=null;return 100}
        if(this.is_drawn(state_array)){state_array[i]=null;return  20}
        state_array[i]=null;
        return 0;
    }
    get_passable_action(){
        let state_array=this.state.squares;
        let actions=[];
        for (let i=0;i<9;i++){
            if(state_array[i]===null){
                actions.push(i)
            }
        }
        return actions
    }
    is_drawn(squares_state){
        let check=0;
        for (let i=0;i<9;i++ ){
            if (squares_state[i]){check+=1}
        }
        if (check===9){return true}
    }



    render() {
        const winner = calculateWinner(this.state.squares);
        let status;
        if(winner) {
            status = 'Winner: ' + winner;
            let player1 = this.state.player1;
            let player2 = this.state.player2;
            let isMyX = this.state.isMyX;
            if(winner === 'X') {
                isMyX? player1[1]++: player2[1]++;
            }else {
                isMyX? player2[1]++: player1[1]++;
            }

            player1[2]++;
            player2[2]++;

        } else {
            status = 'Next player: ' + (this.state.xIsNext? 'X' : 'O');

        }
        return (
            <div>
                <div className="status">{status}</div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
                {this.AI()}
                <button type="button" onClick={this.AIGame.bind(this)}>hard</button>
            </div>
        );
    }
}

export default class GameRoom extends Component {
    constructor(props) {
        super(props);
        let lobSocket = this.props.socket;
        const roomInfo = this.props.roomInfo;
        const username = this.props.username;
        this.state = {
            uid: this.props.uid,
            lobSocket:lobSocket,
            socket: io(),
            username: username,
            roomInfo:roomInfo,
            player1:[],
            player2:[],
            isMyX:null,
            ready:["No", "No"],
            start:false,
        }
        this.getInfo();
    }

    getInfo() {
        const roomInfo = this.state.roomInfo;
        const socket = this.state.socket;
        socket.emit("getInfo", {roomInfo: roomInfo});
    }

    componentDidMount() {
        const socket = this.state.socket;

        socket.on('send-room-info', (o) => {
            let isMyX;
            if(this.state.username === o.player1[0]) {
                isMyX = true;
            } else {
                isMyX = false;
            }
            this.setState({
                player1: o.player1,
                player2: o.player2,
                isMyX: isMyX
            });
        });


        socket.on('sendReady', (o) => {
            var i = o.ready;
            let ready = this.state.ready;
            ready[i] = "Yes";
            this.setState({
                ready:ready

            });
        });

        socket.on('oneGameResultRes', (o) => {
            this.setState({
                player1: o.player1,
                player2: o.player2
            });
        });

        socket.on('onePlayerLeft', (o)=> {
            let leftPerson = o.leftPerson;
            let roomInfo = o.roomInfo;
            if(leftPerson == "player1") {
                this.setState({
                    roomInfo: roomInfo,
                    player1:[],
                    ready:["No", "No"]
                });
            }else if (leftPerson == "player2") {
                this.setState({
                    roomInfo: roomInfo,
                    player2:[],
                    ready:["No", "No"]
                });
            }
        });


    }
    AIStart(e){
        this.setState({
            ready:["Yes", "Yes"]
        });
    }
    getReady(e){
        const socket = this.state.socket;
        const isMyX = this.state.isMyX;
        if(isMyX){
            socket.emit("getReady", {isMyX: isMyX, roomId: this.state.roomInfo[0]});
        } else {
            socket.emit("getReady", {isMyX: isMyX, roomId: this.state.roomInfo[0]});
        }
    }

    getReset(e) {
        this.setState({
            ready:["No", "No"]
        })
    }

    quitGame(e) {
        const socket =this.state.socket;
        const lobSocket =this.state.lobSocket;
        const roomId = this.state.roomInfo[0];
        const roomInfo = this.state.roomInfo;
        const username = this.state.username;
        const player1 = this.state.player1;
        const player2 = this.state.player2;
        const uid = this.state.uid;
        socket.emit("quitGame", {roomId: roomId, roomInfo:roomInfo,
            username: username,player1:player1, player2:player2 });
        lobSocket.emit("returnToLobby" , {uid: uid});
    }


    showPlayer1() {
        let player = this.state.player1;
        return (
                <ul>
                    <li>player1</li>
                    <li>{player[0]}</li>
                    <li>win:{player[1]}</li>
                    <li>played:{player[2]}</li>
                    <li>ready?:{this.state.ready[0]}</li>
                </ul>
        );

    }

    showPlayer2() {
        let player = this.state.player2;
        return (
                <ul>
                    <li>player 2</li>
                    <li>{player[0]}</li>
                    <li>win:{player[1]}</li>
                    <li>played:{player[2]}</li>
                    <li>ready?:{this.state.ready[1]}</li>
                </ul>
        );
    }
    showBoard() {
        let ready = this.state.ready
        if(ready[0]=== "Yes" && ready[1]=== "Yes" ){
            return (
                <Board socket={this.state.socket} username={this.state.username} roomId={this.state.roomInfo[0]} player1={this.state.player1}
        player2={this.state.player2} isMyX={this.state.isMyX}/>
            )
        }
    }

    render() {
        return (
            <div>
                <div className="game">
                    <div className="game-board">
                        {this.showBoard()}
                    </div>
                    <div>{this.showPlayer1()}</div>
                    <div>{this.showPlayer2()}</div>
                </div>
                <div>
                    <button type="button" onClick={this.getReady.bind(this)} >Ready</button>
                    <button type="button" onClick={this.getReset.bind(this)} >Reset</button>
                    <button type="button" onClick={this.quitGame.bind(this)} >Quit</button>
                    <button type="button" onClick={this.AIStart.bind(this)}>AI</button>
                </div>
                <div className="message-list">
                    <Messages socket={this.state.socket}/>
                </div>
            </div>

        );
    }
}
