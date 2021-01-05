import React, { Component } from 'react'
import axios from 'axios'

export class viewAccidentalLeaves extends Component {
    constructor(props) {
        super(props);
    
        //this.getMembers = this.getMembers.bind(this)  
    
        this.state = {leaves: []};
      }
      componentDidMount() {
        axios.get('/Hod/viewAccidentalLeaveReq')
          .then(res => {
           this.setState( {leaves: res.data})
         
          })
          .catch((error) => {
            console.log(error);
          })
      }

    render() {
        return (
            <div>
             <h3>Accidental Leave Requests</h3>
                <table id="leaves"  className="table">
          <thead className="thead-light">
            <tr>
              <th>RequestID</th>
              <th>Name</th>
              <th>ID</th>
              <th>Number of Days</th>
              <th>Status</th>  
              <th>Reason</th>
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
            <div>{leave.reason}</div>
            )
            }
          </td>
          {/* <td>
          <Link to={"/acceptLeaveReq/"}>Accept</Link> | <Link to={"/rejectLeaveReq/"}>Reject</Link>
          </td> */}
          </tr>
          </tbody>
        </table>
            </div>
        )
    }
}

export default viewAccidentalLeaves