import React, { Component } from 'react'
import axios from 'axios'
import {Link} from 'react-router-dom'
export class viewAnnualLeaves extends Component {
    constructor(props) {
        super(props);
    
        //this.getMembers = this.getMembers.bind(this)  
    
        this.state = {leaves: []};
      }
      componentDidMount() {
        axios.get('/Hod/viewAnnualLeaveReq')
          .then(res => {
           this.setState( {leaves: res.data})
           swal(res.data.msg)
          })
          .catch((error) => {
            console.log(error);
          })
      }

    render() {
        return (
            <div>
            <h3>Annual Leave Requests</h3>
                <table id="leaves"  className="table">
          <thead className="thead-light">
            <tr>
              <th>RequestID</th>
              <th>Name</th>
              <th>ID</th>
              <th>Number of Days</th>
              <th>Status</th> 
              <th>Date of Leave</th>
              <th>Annual Balance</th> 
              <th>HOD Comment</th> 
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          
          <tr>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.requestID}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.name}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.id}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.numberOfdays}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.status}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.dateOfLeave}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.AnnualBalance}</div>
            )
            }
          </td>
          <td>
          {
            this.state.leaves.map((leave)=>
            <div>{leave.HodComment}</div>
            )
            }
          </td>
          <td>
          {       
          this.state.leaves.map((leave)=>
          <div>
          <Link to={"/acceptLeaveReq/"+leave.requestID}>Accept</Link> | <Link to={"/rejectLeaveReq/"+leave.requestID}>Reject</Link>
          </div>
          )
          }
          </td>
          </tr>
          </tbody>
        </table>
            </div>
        )
    }
}

export default viewAnnualLeaves
