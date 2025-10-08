export const success = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const failure = (res, message, status = 400) => {
  res.status(status).json({ success: false, message });
};
