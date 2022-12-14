import axios from 'axios';
import React, { Component, useState } from 'react'
import { Button,Modal,Form} from 'react-bootstrap'
import { Link } from 'react-router-dom';


function RejectLeave (props) {
  const [show, setShow] = useState(true);
  const [comment, setCourse] = useState("");

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleCourse = (e) => setCourse(e.target.value);
  const handleSubmit =(e)=>{
    e.preventDefault();
      const mem = {
          comment: comment
      };
    
  console.log(mem.comment)
        axios.put('/Hod/rejectLeaveReq/'+props.location.pathname.substring(16), mem)
            .then(
              res =>
              { console.log("success")
              swal(res.data.msg)
              handleClose();
            },
            err =>
            {
              {swal(err.response.data.errmsg || err.response.data.err)}
              console.log("Feeeeeeee errorrrrrrrr"+err)
            })
    //}
   
}
// function name(params) {
    
// }


    return (
      <div>
      {/* <Button variant="primary" onClick={handleShow}>
        AssignInstructor
      </Button> */}

      <Modal show={show}
      onHide={handleClose}
      
      keyboard={false}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered>
        <Modal.Header>
          <Modal.Title>Reject Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form>
          <Form.Group controlId="formBasicEmail" required>
              <Form.Label>Comment</Form.Label>
              <Form.Control type="text" placeholder="Enter Your Comment" onChange = {handleCourse}/>
          </Form.Group>

          <Button variant="primary" type="submit" onClick={handleSubmit}>
              Submit
          </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      <Link to= '/viewLeaveReq'> Leave Requests </Link >
    </div>
    )
}


export default RejectLeave
