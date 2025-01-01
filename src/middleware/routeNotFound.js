const routeNotFound = (req, res, next) => {
    res.status(404).json({ msg: 'The route you are looking for does not exist' });
};

export default routeNotFound;
