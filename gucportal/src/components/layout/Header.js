import React, { Component, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import {
	Button,
	Collapse,
	Nav,
	Navbar,
	NavDropdown,
	NavbarBrand,
	NavLink,
	Container,
	Form,
	FormControl,
	Card,
} from "react-bootstrap";
import Carousel from "react-bootstrap/Carousel";
import UpdateProfile from "../pages/Member/UpdateProfile";
import ResetPassword from "../pages/Member/ResetPass";
import swal from "sweetalert";
import axios from "axios";
import SideBar from "../layout/SideMenu";
import Login from "../pages/LoginModal";

const handleSignIn = (e) => {
	e.preventDefault();
	axios
		.post("/Member/signIn")
		.then((res) => {
			swal(res.data.msg);
		})
		.catch((err) => swal(err.response.data.errmsg || err.response.data));
};
const handleSignOut = (e) => {
	e.preventDefault();
	axios
		.post("/Member/signOut")
		.then((res) => {
			swal(res.data.msg);
		})
		.catch((err) => swal(err.response.data.errmsg || err.response.data));
};
const handleLogout = (e) => {
	axios
		.get("/Member/logout")
		.then((res) => {
			localStorage.removeItem("authtoken");
			swal(res.data.msg);
			console.log("we rbna loggedout ");
		})
		.catch((err) => {
			console.log(err);
		});
};

class Header extends Component {
	state = {
		isOpen: false,
	};

	toggle = () => {
		this.setState({
			isOpen: !this.state.isOpen,
		});
	};
	render() {
		return (
			<div>
				<Navbar
					bg="dark"
					variant="dark"
					expand="lg"
					className="mb-5"
					fixed="top">
					<Container>
						<Navbar.Brand href="/viewProfile">GUC</Navbar.Brand>
						<Navbar.Toggle
							onClick={this.toggle}
							aria-controls="responsive-navbar-nav"
						/>
						<Navbar.Collapse
							isOpen={this.state.isOpen}
							id="responsive-navbar-nav">
							<Nav className="ml-auto">
								<Nav.Link href="/viewProfile">Profile</Nav.Link>
								{/* <Nav.Link href="#link">Notifications</Nav.Link> */}
								<Nav.Link href="/notification" className="nav-link">
									notifications{" "}
								</Nav.Link>
								<Nav.Link
									variant="primary"
									type="SignIn"
									onClick={handleSignIn}>
									SignIn
								</Nav.Link>
								<Nav.Link
									variant="primary"
									type="SignOut"
									onClick={handleSignOut}>
									SignOut
								</Nav.Link>
								<Nav.Link href="/logOut" onClick={handleLogout}>
									LogOut
								</Nav.Link>
								<NavDropdown title="Attendance" id="basic-nav-dropdown">
									<NavDropdown.Item href="/viewMissingHours">
										View Missing Hours
									</NavDropdown.Item>
									<NavDropdown.Item href="/viewMissingDays">
										View Missing Days
									</NavDropdown.Item>
									<NavDropdown.Item href="/viewAllAttendance">
										View Attendance
									</NavDropdown.Item>
									<NavDropdown.Item href="/viewAllAttendanceByMonth">
										View Attendance by Month
									</NavDropdown.Item>

									<NavDropdown.Divider />
								</NavDropdown>
								<NavDropdown title="Settings" id="basic-nav-dropdown">
									<UpdateProfile />
									<ResetPassword />

									<NavDropdown.Divider />
								</NavDropdown>
							</Nav>
						</Navbar.Collapse>
					</Container>
				</Navbar>
				//{" "}
			</div>
		);
	}
}

export default Header;
