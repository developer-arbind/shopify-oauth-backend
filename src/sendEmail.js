import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from "dotenv";
dotenv.config();
const mailgun = new Mailgun(FormData);

const DOMAIN = "studyspaceowner.me";
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

const sendMail = async (email,code, magicLink) => {
    const messageData = {
        from: `StudySpace <noreply@${DOMAIN}>`,
        to: email,
        subject: "Security Verification",
        text: magicLink ? 'code: ' + code : "url: " + code
      };
    try{  
      const data = await mg.messages.create(DOMAIN, messageData);
      console.log("data: " + data);
      return {
        error: data,
        success: true,
      }  
    }catch(err){
        return {
            error: JSON.stringify(err),
            success: false
        }
    }
}
export default sendMail;