const assert = require("assert");
const jwt = require("jsonwebtoken");
const dbconnection = require("../../database/dbconnection");
const logger = require("../config/config").logger;
const jwtSecretKey = require("../config/config").jwtSecretKey;

const queryString = `SELECT id, firstName, emailAdress, password FROM user WHERE emailAdress = ?`;

let controller = {
  //User uses emaal and password to receive a token.
  login(req, res, next) {
    logger.info("login is called");

    dbconnection.getConnection((err, connection) => {
      if (err) {
        logger.error('No connection from dbconnection.');
        res.status(500).json({
          statusCode: 500,
          message: err.toString(),
        })
      }

      //dbconnection is succesfully connected
      if (connection) {
      logger.info("Database connected!");

          //---------------------------------------------------------------------------------------//
          connection.query(
            queryString,
            [req.body.emailAdress],
            (error, rows, fields) => {
              connection.release();

              if (err) {
                logger.error('Error: ' , err.toString());
                res.status(500).json({
                  statusCode: 500,
                  message: err.toString(),
                })
              }

              //Kijken of het paswoord bestaat en of er wel een password is ingevoerd.
              if (rows && rows.length === 1 && rows[0].password == req.body.password) {
                logger.info("password is correct.");

                const user = rows[0];

                //email en wachtwoord zijn correct dus we geven het token terug.
                jwt.sign(
                  { userid: user.id },
                  jwtSecretKey,
                  { expiresIn: "30d" },
                  function (err, token) {
                    logger.info(token);
                    res.status(200).json({
                      statusCode: 200,
                      message: token,
                    });
                  }
                );

              //email en wachtwoord zijn incorrect dus we geven een error terug.
              } else {
                logger.debug("user not found or password incorrect");
                res.status(401).json({
                  statusCode: 401,
                  message: "email or password incorrect",
                });
              }
            }
          );
          //---------------------------------------------------------------------------------------------------//

      //dbconnection is not connected
      } else {
        logger.info("No connection!");
      }
    });
  },

  //Check if an email and password is given as a string before login.
  validateLogin(req, res, next) {
    logger.info("ValidateLogin called");

    try {
      assert(
        typeof req.body.emailAdress === "string",
        "email must be a string."
      );
      assert(
        typeof req.body.password === "string",
        "password must be a string."
      );
      next();
    } catch (err) {
      res.status(422).json({
        statusCode: 422,
        message: err.toString(),
      });
    }
  },

  //Check if the token that the user uses is correct before performing other actions.
  validateToken(req, res, next) {
    logger.info("ValidateToken called");

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("no authorization header!");
      res.status(401).json({
        statusCode: "401",
        message: "No authorization header",
      });
    } else {
      const token = authHeader.substring(7, authHeader.length);

      jwt.verify(token, jwtSecretKey, (err, payload) => {
        if (err) {
          logger.error("Not authorized");
          res.status(401).json({
            statusCode: 401,
            message: "Not authorized",
          });
        }
        if (payload) {
          logger.debug("token is valid", payload);
          // User heeft toegang. Voeg UserId uit payload toe aan
          // request, voor ieder volgend endpoint.
          req.userId = payload.userid;
          logger.info("userId = ", payload.userid);
          next();
        }
      });
    }
  },
};

module.exports = controller;
