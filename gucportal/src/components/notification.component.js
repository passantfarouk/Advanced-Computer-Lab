import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default class Notification extends Component {
    constructor(props) {
        super(props);

        this.state = {notifications: []};     
    }

componentDidMount(){
    axios.get('/AM/notification')
    .then(response=>{
		if (response == null){
			this.setState({notifications:[] })

		}else{
			this.setState({notifications:response.data })    
            //console.log(this.state.notifications)  
			swal(res.data)
		}
            
              })
              .catch((error) => {
				this.setState({notifications:[] })
                console.log(error)
              });
}
      

  render() {
    return (
      
     <div>
 <div class="alert alert-primary" role="alert">
{this.state.notifications.filter((notifications)=>
            {return notifications.DayoffRequestID}).map((notifications) => (
    
							<h4>
								Your &nbsp;   
								<a
									class="alert alert-primary"
									role="alert"
									href="#"
									class="alert-link">
									<span>{notifications.DayoffRequestID}</span>
								</a>
                &nbsp;
								is   
                &nbsp;
							   	{notifications.DayoffStatus}
							</h4>
						))}
</div>
<br/>
<div class="alert alert-primary" role="alert">
{this.state.notifications.filter((notifications)=>
            {return notifications.repreqRequestID}).map((notifications) => (
							<h4>
								Your &nbsp;   
								<a
									class="alert alert-primary"
									role="alert"
									href="#"
									class="alert-link">
									<span>{notifications.repreqRequestID}</span>
								</a>
                &nbsp;
								is   
                &nbsp;
							   	{notifications.repreqStatus}
							</h4>
						))}
</div>
<br/>
<div class="alert alert-primary" role="alert">
{this.state.notifications.filter((notifications)=>
            {return notifications.slotlinkRequestID}).map((notifications) => (
							<h4>
								Your &nbsp;   
								<a
									class="alert alert-primary"
									role="alert"
									href="#"
									class="alert-link">
									<span>{notifications.slotlinkRequestID}</span>
								</a>
                &nbsp;
								is   
                &nbsp;
							   	{notifications.slotlinkStatus}
							</h4>
						))}
</div>
<br/>
<div class="alert alert-primary" role="alert">
{this.state.notifications.filter((notifications)=>
            {return notifications.leavesRequestID}).map((notifications) => (
  
    	<h4>
								Your &nbsp;   
								<a
									class="alert alert-primary"
									role="alert"
									href="#"
									class="alert-link">
                    
									<span>{notifications.leavesRequestID}</span>
								</a>
                &nbsp;
								is   
                &nbsp;
							   	{notifications.leavesStatus}
							</h4>
						))} 
  </div>
						

       </div>    




    );
  }
}