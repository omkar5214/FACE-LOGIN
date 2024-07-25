import './App.css';
import React, { Component } from 'react';
const uuid = require('uuid');

function getExtension(filename) {
  let ext = filename.split('.').pop()
  if (ext === 'jpg') {
    return 'jpeg'
  } else {
    return ext
  }
}


async function authenticate(visitorImageName) {
  const requestURL = 'https://3xn4m5dpvi.execute-api.ap-south-1.amazonaws.com/dev/student?' + new URLSearchParams({
    objectKey: `${visitorImageName}.jpeg`,
  });
  return await fetch(requestURL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
  .then((data) => {
    return data;
  }).catch(error => console.error(error));
}

class App extends Component {
  state = {
    selectedFile: null,
    selectedFileUrl: null, // New state to hold URL of selected image
    selectedFileStudent: null,
    firstName: null,
    lastName: null,
    addingStudent: false,
    fileUploadedSuccessfully: false,
    uploadResultMessage: <h5>Please upload an image to authenticate</h5>,
    uploadAddStudentMessage: <h4>Click to add student to database</h4>,
    isAuth: false
    
  }
  activateCamera = () => {
    this.setState({ cameraActive: true });
    // Access the user's camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Display the stream from the camera on a video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        // Append the video element to a div
        document.getElementById('camera').appendChild(video);
        // Store the stream in state to access it later for capturing image
        this.setState({ cameraStream: stream });
      })
      .catch(error => console.error('Error accessing camera:', error));
  }

  captureImage = () => {
    // Create a canvas element to capture the image
    const canvas = document.createElement('canvas');
    canvas.width = 640; // Adjust width as needed
    canvas.height = 480; // Adjust height as needed
    const context = canvas.getContext('2d');
    // Draw the current frame from the camera onto the canvas
    context.drawImage(document.querySelector('video'), 0, 0, canvas.width, canvas.height);
    // Convert the canvas image to a data URL
    const imageDataURL = canvas.toDataURL('image/jpeg');
    // Stop the camera stream
    this.state.cameraStream.getTracks().forEach(track => track.stop());
    // Update state with the captured image
    this.setState({
      selectedFileUrl: imageDataURL,
      selectedFile: this.dataURLtoFile(imageDataURL, 'photo.jpg'),
      cameraActive: false, // Deactivate camera after capturing image
    });
  }

  dataURLtoFile = (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
  onAddStudent = () => {
    if (this.state.addingStudent) {
      this.setState({addingStudent: false});
      this.setState({uploadAddStudentMessage: <h4>Click to add student to database</h4>});
    } else {
      this.setState({addingStudent: true});
      this.setState({uploadAddStudentMessage: <h4>Please upload an image to add student to database</h4>});
    }
  }

  onFileChange = event => {
    // this.setState({selectedFile: event.target.files[0]});
    const file = event.target.files[0];
    const fileUrl = URL.createObjectURL(file); // Create URL for the selected file
    this.setState({
      selectedFile: file,
      selectedFileUrl: fileUrl // Set the URL in state
    });
  }

  // onFileChangeStudent = event => {
  //   this.setState({selectedFileStudent: event.target.files[0]});
  // }
  onFileChangeStudent = event => {
    this.setState({
      selectedFileStudent: event.target.files[0]
    });
  }
  
  onFileUpload = () => {
    if (this.state.selectedFileStudent) { // Add a check to ensure selectedFileStudent is not null
      const img_extension = getExtension(this.state.selectedFileStudent.name);
      const fileName = this.state.firstName + "_" + this.state.lastName + "." + img_extension;
      console.log(fileName);
      fetch(`https://3xn4m5dpvi.execute-api.ap-south-1.amazonaws.com/dev/student-registered-images/${fileName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': `image/${img_extension}`
        },
        body: this.state.selectedFileStudent
      }).then(async () => {
        this.onAddStudent();
        this.setState({uploadAddStudentMessage: 'Successfully student added!'});
      }).catch(error => {
        console.error(error);
      })
    } else {
      console.error('No file selected for upload.'); // Log an error if no file is selected
    }
  }
  
  onAuthenticate = () => {
    const visitorImageName = uuid.v4();
    const img_extension = getExtension(this.state.selectedFile.name);
    fetch(`https://3xn4m5dpvi.execute-api.ap-south-1.amazonaws.com/dev/visitor-authenticate-images/${visitorImageName}.jpeg`, {
      method: 'PUT',
      headers: {
        'Content-Type': `image/${img_extension}`
      },
      body: this.state.selectedFile
    }).then(async () => {
      this.setState({uploadResultMessage: <h5 id='auth'>Authenticating...</h5>});
      const response = await authenticate(visitorImageName);
      if ( response.Message === 'Success' ) {
        this.setState({isAuth: true});
        this.setState({uploadResultMessage: <h5 id='pass'>Hi {response['firstName']} {response['lastName']}, welcome to college!</h5>});
      } else {
        this.setState({isAuth: false});
        this.setState({uploadResultMessage: <h5 id='fail'>Authentication failed. Please try again.</h5>});
      }
    }).catch(error => {
      this.setState({isAuth: false});
      this.setState({uploadResultMessage: <h5 id='fail'>There is an error during authentication process. Please try again.</h5>})
      console.error(error);
    })
  }

  onFirstNameChange = e => {
    this.setState({firstName: e.target.value});
  }

  onLastNameChange = e => {
    this.setState({lastName: e.target.value});
  }

  addStudent = () => {
    if (this.state.addingStudent) {
      return (
        <><div>
          <br />
          <h3>Student details:</h3>
          <label>
            First name: <input name="firstName" onChange={this.onFirstNameChange} />
          </label>
          <label>
            Last name: <input name="lastName" onChange={this.onLastNameChange} />
          </label>
        </div>
        <div>
            <input type="file" name="image" accept="image/png, image/jpeg" onChange={this.onFileChangeStudent} />
        </div>
        <div>
          <button onClick={this.onFileUpload}>
            Add Student
          </button>
          <button className="cancel" onClick={this.onAddStudent}>
            Cancel
          </button>
        </div></>
      )
    } else {
      return (
        <div>
          <br />
          <button onClick={this.onAddStudent}>
            Add Student
          </button>
        </div>
      )
    }
  }

  fileData = () => {
    if (this.state.selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {this.state.selectedFile.name}</p>
          <p>File Type: {this.state.selectedFile.type}</p>
        </div>
      )
    } else if (this.state.fileUploadedSuccessfully) {
      return (
        <div>
          <br />
          <h4 id='pass'>Your file has been successfully uploaded</h4>
        </div>
      )
    } else {
      return (
        <div>
          <br />
          <h4>Choose a file and then press the Upload button</h4>
        </div>
      )
    }
  }

  render() {
    return (
      <div className='container'>
        
        <h2>Welcome to VIT</h2>
        <h3>Select Authentication Method</h3>
        <div>
          <button className="camera" onClick={() => this.setState({ authenticationMethod: 'camera' })}>Authentication with Camera</button>
          <button className="camimg" onClick={() => this.setState({ authenticationMethod: 'image' })}>Authentication with Image</button>
        </div>
  
        {this.state.authenticationMethod === 'camera' && (
          <>
            {!this.state.cameraActive ? (
              <button className='activate' onClick={this.activateCamera}>Activate Camera</button>
            ) : (
              <button onClick={this.captureImage}>Capture Image</button>
              
            )}
            <button onClick={this.onAuthenticate}>
              Upload
            </button>
            <div className={this.state.isAuth ? 'success' : 'failure'}>{this.state.uploadResultMessage}</div>
          </>
        )}
  
        {this.state.authenticationMethod === 'image' && (
          <>
            <label htmlFor="file-input" className="custom-file-input">Choose File</label>
            <input type="file" name="image" id='file-input' accept="image/png, image/jpeg" onChange={this.onFileChange} />
            <button onClick={this.onAuthenticate}>
              Upload
            </button>
            <div className={this.state.isAuth ? 'success' : 'failure'}>{this.state.uploadResultMessage}</div>
          </>
        )}
  
        {/* Display selected image */}
        {this.state.selectedFileUrl && (
          <div>
            <h3>Selected Image</h3>
            <img src={this.state.selectedFileUrl} alt="Selected" style={{ maxWidth: '100%', maxHeight: '200px' }} />
          </div>
        )}
  
        {/* Display camera feed */}
        {this.state.cameraActive && (
          <div id="camera"></div>
        )}
  
        <div>
          
          {this.state.addingStudent ? (
            <><div>
              
              <br />
              <h3>Student details:</h3>
              <label>
                First name: <input name="firstName" onChange={this.onFirstNameChange} />
              </label>
              <label>
                Last name: <input name="lastName" onChange={this.onLastNameChange} />
              </label>
            </div>
            <div>
                <label htmlFor="file-input" className="custom-file-input">Choose File</label>
                <input type="file" name="image" id="file-input" accept="image/png, image/jpeg" onChange={this.onFileChangeStudent} />
            </div>
            {this.state.selectedFileStudent && (
          <div>
            <h3>Selected Image</h3>
            <img src={URL.createObjectURL(this.state.selectedFileStudent)} alt="Selected" style={{ maxWidth: '100%', maxHeight: '200px' }} />
          </div>
        )}
            <div>
              <button onClick={this.onFileUpload}>
                Add Student
              </button>
              <button className="cancel" onClick={this.onAddStudent}>
                Cancel
              </button>
            </div></>
          ) : (
            <div>
              <br />
              <button className='addst' onClick={this.onAddStudent}>
                Add Student
              </button>
            </div>
          )}
           

        </div>
  
        <div>{this.state.uploadAddStudentMessage}</div>
      </div>
    )
  }
}  

export default App;
