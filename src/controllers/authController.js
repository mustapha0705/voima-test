import User from "../models/userModel.js";

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ msg: "Please provide a name, an email, and a password" });
  }

  const userEmail = await User.findOne({ email });

  if (userEmail) {
    return res.status(401).json({ msg: "The email has already been used" });
  }

  const user = await User.create({ ...req.body });

  const token = user.createJWT();

  res.status(200).json({ user: { name: user.name }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: "Please provide an email and a password" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const token = user.createJWT();

  res.status(200).json({ user: { name: user.name }, token });
};

export { login, register };
