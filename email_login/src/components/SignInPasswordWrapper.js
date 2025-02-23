import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { popupType } from './PanelWrapper';
import { ButtonState } from './Button';
import SignInPassword from './SignInPassword';
import { validatePassword } from '../validators/validators';
import {
  closeLoginWindow,
  login,
  openCreateKeysLoadingWindow,
  resetPassword,
  throwError
} from '../utils/ipc';
import { hashPassword } from '../utils/HashUtils';
import { parseRateLimitBlockingTime } from '../utils/TimeUtils';
import string from '../lang';
import { appDomain } from '../utils/const';

const LOGIN_STATUS = {
  SUCCESS: 200,
  WRONG_CREDENTIALS: 400,
  CHANGE_PASSWORD: 412,
  TOO_MANY_REQUESTS: 429,
  TOO_MANY_DEVICES: 439
};

class SignInPasswordWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonState: ButtonState.DISABLED,
      values: {
        usernameOrEmailAddress: props.value,
        password: ''
      }
    };
  }

  componentDidMount() {
    this.checkDisable();
  }

  render() {
    return (
      <SignInPassword
        {...this.props}
        buttonState={this.state.buttonState}
        onClickForgot={this.handleClickForgot}
        onCLickSignInWithPassword={this.handleClickSignInWithPassword}
        onChangeField={this.handleChangeField}
        onDismissPopup={this.onDismissPopup}
        popupContent={this.state.popupContent}
        values={this.state.values}
      />
    );
  }

  validatePassword = () => {
    const password = this.state.values.password;
    return validatePassword(password);
  };

  checkDisable = () => {
    const isValid = this.validatePassword();
    const buttonState = isValid ? ButtonState.ENABLED : ButtonState.DISABLED;
    this.setState({
      buttonState
    });
  };

  handleChangeField = event => {
    const values = {
      ...this.state.values,
      [event.target.name]: event.target.value
    };
    this.setState({ values }, () => {
      this.checkDisable();
    });
  };

  handleClickSignInWithPassword = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.hasTwoFactorAuth) {
      this.props.goToWaitingApproval(this.state.values.password);
    } else {
      this.setState({
        buttonState: ButtonState.LOADING
      });
      const [
        username,
        domain = appDomain
      ] = this.state.values.usernameOrEmailAddress.split('@');
      const password = this.state.values.password;
      const hashedPassword = hashPassword(password);
      const submittedData = {
        username,
        domain,
        password: hashedPassword
      };
      const res = await login(submittedData);
      const { status, body, headers } = res;
      const recipientId =
        domain === appDomain
          ? username
          : this.state.values.usernameOrEmailAddress;
      this.handleLoginStatus(status, body, headers, recipientId);
    }
  };

  handleLoginStatus = (status, body, headers, recipientId) => {
    switch (status) {
      case LOGIN_STATUS.SUCCESS: {
        const { deviceId, name } = body;
        openCreateKeysLoadingWindow({
          loadingType: 'signin',
          remoteData: {
            recipientId,
            deviceId,
            name
          }
        });
        closeLoginWindow({ forceClose: true });
        break;
      }
      case LOGIN_STATUS.WRONG_CREDENTIALS: {
        this.throwLoginError(string.errors.wrongCredentials);
        break;
      }
      case LOGIN_STATUS.TOO_MANY_REQUESTS: {
        const seconds = headers['retry-after'];
        const tooManyRequestErrorMessage = {
          ...string.errors.tooManyRequests
        };
        // eslint-disable-next-line fp/no-mutation
        tooManyRequestErrorMessage['description'] += parseRateLimitBlockingTime(
          seconds
        );
        this.throwLoginError(tooManyRequestErrorMessage);
        break;
      }
      case LOGIN_STATUS.TOO_MANY_DEVICES: {
        // check
        this.throwLoginError(string.errors.tooManyDevices);
        break;
      }
      case LOGIN_STATUS.CHANGE_PASSWORD: {
        this.props.onGoToChangePassword(this.state.values.password);
        break;
      }
      default: {
        this.throwLoginError({
          name: string.errors.loginFailed.name,
          description: string.errors.loginFailed.description + status
        });
        break;
      }
    }
  };

  handleClickForgot = async e => {
    e.preventDefault();
    e.stopPropagation();
    const [
      recipientId,
      domain = appDomain
    ] = this.state.values.usernameOrEmailAddress.split('@');
    const params = {
      recipientId,
      domain
    };
    const { status, body } = await resetPassword(params);
    const popup = popupType.FORGOT_PASSWORD;
    const data = this.formPopupData(status, body);
    return this.props.setPopupContent(popup, data);
  };

  formPopupData = (status, body) => {
    switch (status) {
      case 200: {
        const blurEmailRecovery = body.address;
        return { status, blurEmailRecovery };
      }
      case 400: {
        return { status };
      }
      default:
        return { status: 'error' };
    }
  };

  onDismissPopup = () => {
    this.setState({
      popupContent: null
    });
  };

  throwLoginError = error => {
    this.setState({
      buttonState: ButtonState.ENABLED
    });
    throwError(error);
  };
}

// eslint-disable-next-line fp/no-mutation
SignInPasswordWrapper.propTypes = {
  usernameValue: PropTypes.string
};

export default SignInPasswordWrapper;
