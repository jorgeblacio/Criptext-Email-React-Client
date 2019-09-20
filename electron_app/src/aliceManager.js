const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');
const dbManager = require('./DBManager');
const portscanner = require('portscanner');
const http = require('http');

const getLogsPath = node_env => {
  switch (node_env) {
    case 'test': {
      return './src/__integrations__/alice_logs.txt';
    }
    case 'development': {
      return path
        .join(__dirname, '/alice_logs.txt')
        .replace('/app.asar', '')
        .replace('/src', '');
    }
    default: {
      const userDataPath = app.getPath('userData');
      return path
        .join(userDataPath, '/alice_logs.txt')
        .replace('/app.asar', '')
        .replace('/src', '');
    }
  }
};

const getAlicePath = nodeEnv => {
  switch (nodeEnv) {
    case 'development': {
      return path.join(__dirname, '../../signal_interface/build/Release/alice');
    }
    default: {
      return path.join(path.dirname(__dirname), '../extraResources', 'alice');
    }
  }
};

let port = 8085;
let alice = null;
let aliceStartTimeout = null;

const getPort = () => {
  return port;
};

const startAlice = async () => {
  aliceStartTimeout = null;
  if (!alice) {
    const myPort = await portscanner.findAPortNotInUse(8085);
    port = myPort;

    const alicePath = getAlicePath(process.env.NODE_ENV);
    const dbpath = path.resolve(dbManager.databasePath);
    const logspath = path.resolve(getLogsPath(process.env.NODE_ENV));
    alice = spawn(alicePath, [dbpath, myPort, logspath]);
    alice.stdout.on('data', data => {
      console.log(`-----alice-----\n${data}\n -----end-----`);
    });
    alice.on('exit', (code, signal) => {
      console.log(`alice exited with code ${code} and signal ${signal}`);
      alice = null;
      if (signal !== 'SIGTERM' && signal !== 'SIGABRT') {
        return;
      }
      aliceStartTimeout = setTimeout(() => {
        startAlice();
      }, 500);
    });

    alice.on('close', code => {
      console.log(`alice closed with code ${code}`);
      alice = null;
    });
  }
};

const closeAlice = () => {
  if (alice) {
    alice.kill();
    alice = null;
  } else if (aliceStartTimeout) {
    clearTimeout(aliceStartTimeout);
    aliceStartTimeout = null;
  }
};

const restartAlice = async () => {
  console.log('Restarting ALice');
  const isReachable = await checkReachability()
  if (isReachable) {
    return;
  }
  closeAlice();
  await startAlice();
  await checkReachability();
};

const isReachable = async () => {
  const options = {
    hostname: 'localhost',
    port,
    path: '/ping',
    method: 'GET',
    timeout: 500
  }

  return new Promise( (resolve) => {
    const req = http.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`)
    
      res.on('data', body => {
        console.log(body.toString());
        resolve(body.toString().trim() === 'pong');
      })
    })
    
    req.on('error', error => {
      console.log(error)
      resolve(false)
    })
    
    req.end()
  })
}

const sleep = async (time) => {
  return new Promise( (resolve) => {
    setTimeout( () => {
      resolve();
    }, time)
  })
}

const checkReachability = async () => {
  let retries = 3;
  while (retries > 0) {
    const reachable = await isReachable();
    if (reachable) {
      return true;
    }
    retries--;
    await sleep(500);
  }
  return false
}

module.exports = {
  startAlice,
  restartAlice,
  closeAlice,
  getPort,
  checkReachability,
  isReachable
};
