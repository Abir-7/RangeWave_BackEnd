import Service from "./service.model";
import { IService } from "./service.interface";

const createService = async (
  serviceData: Partial<IService>,
  userId: string
): Promise<IService> => {
  const service = await Service.create({ ...serviceData, user: userId });
  return service;
};

const getServiceById = async (id: string): Promise<IService> => {
  const service = await Service.findById(id);
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
};

const cancelService = async (
  id: string,
  serviceData: Partial<IService>
): Promise<IService> => {
  const service = await Service.findByIdAndUpdate(id, serviceData, {
    new: true,
  });
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
};

export const ServiceService = {
  createService,
  getServiceById,
  cancelService,
};
