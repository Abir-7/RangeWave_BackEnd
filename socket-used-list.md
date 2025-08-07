//socket-emit

// when new service created
io.emit("new-service", { serviceId: service._id }); 


//when new bid created
  io.emit(`service-${saveBid.reqServiceId}`, { serviceId: saveBid.reqServiceId });


//hire mechanic
    io.emit(`hire-${bidData.mechanicId}`, {
      serviceId: isServiceExist._id,
      paymentId: payment[0]._id,
    });


// when mechanic change status

    io.emit(`service-status-${serviceData.user}`, { paymentId: pId });


// when user mark status as complete
      io.emit(`mark-complete-${paymentData.mechanicId}`, {
        paymentId: paymentData._id,
      });


