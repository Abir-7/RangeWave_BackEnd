//socket-emit

// when new service created
io.emit("new-service", { serviceId: service._id }); 


//when new bid created
io.emit("new-bid", { serviceId: saveBid._id }); 


// when save payment
io.emit("new-hire", { bidId }) 


// when cencel a service
io.emit("cencel", { serviceId: id }); 


// when mechanic change status
io.emit("status", { serviceId: serviceData._id }); 


// when user mark status as complete
io.emit("markAsComplete", { bidId: bidData._id }); 


