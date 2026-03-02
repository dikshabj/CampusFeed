import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({ cors: true }) 
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server; 

  
  handleConnection(client: Socket) {
    console.log(` User connected to real-time feed: ${client.id}`);
  }


  handleDisconnect(client: Socket) {
    console.log(`User disconnected: ${client.id}`);
  }

 

  // 1. Broadcast to everyone (Used for the Smart Feed)
  sendNewPostAlert(postTitle: string, type: string) {
    this.server.emit('new_post', {
      message: `New ${type} posted: ${postTitle}`,
      time: new Date().toISOString(),
    });
  }

  // 2. Targeted Alert (Used for Grades)
  sendGradeAlert(studentId: number, subject: string) {
   
    // The frontend will only listen to the channel with the logged-in student's ID!
    this.server.emit(`grade_alert_${studentId}`, {
      message: `Your marks for ${subject} have been published!`,
      time: new Date().toISOString(),
    });
  }
}