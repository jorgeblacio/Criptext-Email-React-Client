import { connect } from 'react-redux';
import {
  addDataApp,
  loadEmails,
  loadEvents,
  loadFeedItems,
  loadThreads,
  updateBadgeLabels,
  updateEmailIdsThread,
  updateFeedItems,
  unsendEmailOnSuccess,
  unsendEmailFiles,
  updateLoadingSync,
  stopLoadSync
} from '../actions';
import PanelWrapper from '../components/PanelWrapper';
import { LabelType } from '../utils/electronInterface';
import { updateSettings } from '../utils/ipc';
import { defineRejectedLabels } from '../utils/EmailUtils';

const mapStateToProps = state => {
  const labelIds = state
    .get('threads')
    .keySeq()
    .toArray();
  const result = labelIds.reduce((result, id) => {
    const size = state
      .get('threads')
      .get(`${id}`)
      .get('list').size;
    return { ...result, [id]: size };
  }, {});
  return result;
};

const defineContactType = labelId => {
  if (labelId === LabelType.sent.id || labelId === LabelType.draft.id) {
    return ['to', 'cc'];
  }
  return ['from'];
};

const mapDispatchToProps = dispatch => {
  return {
    onAddDataApp: data => {
      dispatch(addDataApp(data));
    },
    onLoadEmails: threadId => {
      dispatch(loadEmails({ threadId }));
    },
    onLoadEvents: params => {
      dispatch(loadEvents(params));
    },
    onLoadFeedItems: () => {
      dispatch(loadFeedItems(true));
    },
    onLoadThreads: (params, shouldStopAll) => {
      const { labelId } = params;
      const rejectedLabelIds = defineRejectedLabels(labelId);
      const contactTypes = defineContactType(labelId);
      dispatch(
        loadThreads(
          { ...params, rejectedLabelIds, contactTypes },
          shouldStopAll
        )
      );
    },
    onStopLoadSync: () => {
      dispatch(stopLoadSync());
    },
    onUnsendEmail: (emailId, date, status) => {
      dispatch(unsendEmailOnSuccess(String(emailId), date, status));
      dispatch(unsendEmailFiles(emailId));
    },
    onUpdateLoadingSync: ({ totalTask, completedTask }) => {
      dispatch(updateLoadingSync({ totalTask, completedTask }));
    },
    onUpdateEmailIdsThread: ({
      labelId,
      threadId,
      emailIdToAdd,
      emailIdsToRemove
    }) => {
      dispatch(
        updateEmailIdsThread({
          labelId,
          threadId,
          emailIdToAdd,
          emailIdsToRemove
        })
      );
    },
    onUpdateOpenedAccount: async () => {
      return await updateSettings({ opened: true });
    },
    onUpdateFeedItems: feedItemIds => {
      dispatch(updateFeedItems({ ids: feedItemIds, seen: true }));
    },
    onUpdateUnreadEmailsBadge: labelIds => {
      dispatch(updateBadgeLabels(labelIds));
    }
  };
};

const Panel = connect(
  mapStateToProps,
  mapDispatchToProps
)(PanelWrapper);

export default Panel;
