import UserModel from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js'

class UserController {

  // ===============================
  // USER REGISTRATION
  // ===============================
  static userRegistration = async (req, res) => {
    try {
      const { name, email, password, password_confirmation, tc } = req.body

      if (!name || !email || !password || !password_confirmation || !tc) {
        return res.status(400).json({
          status: "failed",
          message: "All fields are required"
        })
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Password and Confirm Password do not match"
        })
      }

      const existingUser = await UserModel.findOne({ email })
      if (existingUser) {
        return res.status(409).json({
          status: "failed",
          message: "Email already exists"
        })
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        tc
      })

      await user.save()

      const token = jwt.sign(
        { userID: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5d" }
      )

      return res.status(201).json({
        status: "success",
        message: "Registration successful",
        token
      })

    } catch (error) {
      console.error("Registration Error:", error)
      return res.status(500).json({
        status: "failed",
        message: "Unable to register user"
      })
    }
  }

  // ===============================
  // USER LOGIN
  // ===============================
  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          status: "failed",
          message: "All fields are required"
        })
      }

      const user = await UserModel.findOne({ email })
      if (!user) {
        return res.status(401).json({
          status: "failed",
          message: "Invalid credentials"
        })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({
          status: "failed",
          message: "Invalid credentials"
        })
      }

      const token = jwt.sign(
        { userID: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5d" }
      )

      return res.status(200).json({
        status: "success",
        message: "Login successful",
        token
      })

    } catch (error) {
      console.error("Login Error:", error)
      return res.status(500).json({
        status: "failed",
        message: "Unable to login"
      })
    }
  }

  // ===============================
  // CHANGE PASSWORD (LOGGED-IN USER)
  // ===============================
  static changeUserPassword = async (req, res) => {
    try {
      const { password, password_confirmation } = req.body

      if (!password || !password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "All fields are required"
        })
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Passwords do not match"
        })
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      await UserModel.findByIdAndUpdate(req.user._id, {
        $set: { password: hashedPassword }
      })

      return res.status(200).json({
        status: "success",
        message: "Password changed successfully"
      })

    } catch (error) {
      console.error("Change Password Error:", error)
      return res.status(500).json({
        status: "failed",
        message: "Unable to change password"
      })
    }
  }

  // ===============================
  // LOGGED USER DETAILS
  // ===============================
  static loggedUser = async (req, res) => {
    return res.status(200).json({
      user: req.user
    })
  }

  // ===============================
  // SEND PASSWORD RESET EMAIL
  // ===============================
  static sendUserPasswordResetEmail = async (req, res) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          status: "failed",
          message: "Email field is required"
        })
      }

      const user = await UserModel.findOne({ email })
      if (!user) {
        return res.status(404).json({
          status: "failed",
          message: "Email does not exist"
        })
      }

      const secret = user._id + process.env.JWT_SECRET_KEY
      const token = jwt.sign(
        { userID: user._id },
        secret,
        { expiresIn: "15m" }
      )

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password Reset Link",
        html: `
          <p>Hello ${user.name},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link is valid for 15 minutes.</p>
        `
      })

      return res.status(200).json({
        status: "success",
        message: "Password reset email sent successfully"
      })

    } catch (error) {
      console.error("Reset Email Error:", error)
      return res.status(500).json({
        status: "failed",
        message: "Unable to send reset email"
      })
    }
  }

  // ===============================
  // RESET PASSWORD USING TOKEN
  // ===============================
  static userPasswordReset = async (req, res) => {
    try {
      const { password, password_confirmation } = req.body
      const { id, token } = req.params

      if (!password || !password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "All fields are required"
        })
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Passwords do not match"
        })
      }

      const user = await UserModel.findById(id)
      if (!user) {
        return res.status(404).json({
          status: "failed",
          message: "User not found"
        })
      }

      const secret = user._id + process.env.JWT_SECRET_KEY
      jwt.verify(token, secret)

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      await UserModel.findByIdAndUpdate(user._id, {
        $set: { password: hashedPassword }
      })

      return res.status(200).json({
        status: "success",
        message: "Password reset successfully"
      })

    } catch (error) {
      console.error("Reset Password Error:", error)
      return res.status(400).json({
        status: "failed",
        message: "Invalid or expired token"
      })
    }
  }
}

export default UserController
