import {Checkbox, PageSection, Title, ToolbarGroup, ToolbarItem} from '@patternfly/react-core';
import {Link, Route, useHistory} from 'react-router-dom';
import React, {useState, useEffect, useReducer, Fragment} from 'react';
import { Button } from '@patternfly/react-core';
import {getServer} from '@app/utils/utils';
import {TopToolbar} from '../shared/top-toolbar';
import { PlusCircleIcon } from '@patternfly/react-icons';
import sharedMessages from '../messages/shared.messages';
import {cellWidth} from "@patternfly/react-table";
import ActivationsTableContext from './activations-table-context';
import {TableToolbarView} from "@app/shared/table-toolbar-view";
import TableEmptyState from "@app/shared/table-empty-state";
import isEmpty from 'lodash/isEmpty';
import {useIntl} from "react-intl";
import {defaultSettings} from "@app/shared/pagination";
import {NewActivation} from "@app/NewActivation/NewActivation";
import {createRows} from "@app/Activations/activations-table-helpers";

interface ActivationType {
  id: string;
  git_hash?: string;
  name: string;
}

const endpoint = 'http://' + getServer() + '/api/activation_instances/';

const columns = (intl, selectedAll, selectAll) => [
  {
    title: (
      <Checkbox onChange={selectAll} isChecked={selectedAll} id="select-all" />
    ),
    transforms: [cellWidth(10 )]
  },
  {
  title: (intl.formatMessage(sharedMessages.name)),
    transforms: [cellWidth(80 )]
  }
];

const prepareChips = (filterValue, intl) =>
  filterValue
    ? [
      {
        category: intl.formatMessage(sharedMessages.name),
        key: 'name',
        chips: [{ name: filterValue, value: filterValue }]
      }
    ]
    : [];

const initialState = (filterValue = '') => ({
  filterValue,
  isFetching: true,
  isFiltering: false,
  selectedActivations: [],
  selectedAll: false,
  rows: []
});

const areSelectedAll = (rows = [], selected) =>
  rows.every((row) => selected.includes(row.id));

const unique = (value, index, self) => self.indexOf(value) === index;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const activationsListState = (state, action) => {
  switch (action.type) {
    case 'setRows':
      return {
        ...state,
        rows: action.payload,
        selectedAll: areSelectedAll(action.payload, state.selectedActivations)
      };
    case 'setFetching':
      return {
        ...state,
        isFetching: action.payload
      };
    case 'setFilterValue':
      return { ...state, filterValue: action.payload };
    case 'select':
      return {
        ...state,
        selectedAll: false,
        selectedActivations: state.selectedActivations.includes(action.payload)
          ? state.selectedActivations.filter((id) => id !== action.payload)
          : [...state.selectedActivations, action.payload]
      };
    case 'selectAll':
      return {
        ...state,
        selectedActivations: [
          ...state.selectedActivations,
          ...action.payload
        ].filter(unique),
        selectedAll: true
      };
    case 'unselectAll':
      return {
        ...state,
        selectedActivations: state.selectedActivations.filter(
          (selected) => !action.payload.includes(selected)
        ),
        selectedAll: false
      };
    case 'resetSelected':
      return {
        ...state,
        selectedActivations: [],
        selectedAll: false
      };
    case 'setFilteringFlag':
      return {
        ...state,
        isFiltering: action.payload
      };
    case 'clearFilters':
      return { ...state, filterValue: '', isFetching: true };
    default:
      return state;
  }
};

const fetchActivations = (pagination = defaultSettings) => fetch(endpoint, {
  headers: {
    'Content-Type': 'application/json',
  },
});

const Activations: React.FunctionComponent = () => {
  const intl = useIntl();
  const history = useHistory();
  const [activations, setActivations] = useState<ActivationType[]>([]);
  const [limit, setLimit] = useState(defaultSettings.limit);
  const [offset, setOffset] = useState(1);

  const data = activations;
  const meta = {count: activations?.length || 0, limit, offset};
  const [
    {
      filterValue,
      isFetching,
      isFiltering,
      selectedActivations,
      selectedAll,
      rows
    },
    stateDispatch
  ] = useReducer(activationsListState, initialState());

  const setSelectedActivations = (id) =>
    stateDispatch({type: 'select', payload: id});

  const updateActivations = (pagination) => {
    stateDispatch({type: 'setFetching', payload: true});
    return fetchActivations(pagination)
      .then(() => stateDispatch({type: 'setFetching', payload: false}))
      .catch(() => stateDispatch({type: 'setFetching', payload: false}));
  };

  useEffect(() => {
    fetchActivations().then(response => response.json())
      .then(data => { setActivations(data); stateDispatch({type: 'setRows', payload: createRows(activations)});});
  }, []);

  useEffect(() => {
    updateActivations(defaultSettings);
  }, []);

  useEffect(() => {
    stateDispatch({type: 'setRows', payload: createRows(activations)});
  }, [activations]);

  const clearFilters = () => {
    stateDispatch({type: 'clearFilters'});
    return updateActivations(meta);
  };

  const handleFilterChange = (value) => {
    !value || value === ''
      ? clearFilters()
      : stateDispatch({type: 'setFilterValue', payload: value});
  };

  const routes = () => (
    <Fragment>
      <Route
        exact
        path={'/new-activation'}
        render={(props) => (
          <NewActivation {...props} />
        )}
      />
    </Fragment>
  );

  const actionResolver = () => [
    {
      title: intl.formatMessage(sharedMessages.delete),
      component: 'button',
      onClick: (_event, _rowId, activation) =>
        history.push({
          pathname: '/remove-activation',
          search: `?activation=${activation.id}`
        })
    }
  ];

  const selectAllFunction = () =>
    selectedAll
      ? stateDispatch({type: 'unselectAll', payload: data.map((wf) => wf.id)})
      : stateDispatch({type: 'selectAll', payload: data.map((wf) => wf.id)});

  const anyActivationsSelected = selectedActivations.length > 0;

  const toolbarButtons = () => (
    <ToolbarGroup className={`pf-u-pl-lg top-toolbar`}>
      <ToolbarItem>
        <Link
          id="add-activation-link"
          to={{pathname: '/new-activation'}}
        >
          <Button
            ouiaId={'add-activation-link'}
            variant="primary"
            aria-label={intl.formatMessage(sharedMessages.add)}
          >
            {intl.formatMessage(sharedMessages.add)}
          </Button>
        </Link>
      </ToolbarItem>
      <ToolbarItem>
        <Link
          id="remove-multiple-activations"
          className={anyActivationsSelected ? '' : 'disabled-link'}
          to={{pathname: '/remove-activations'}}
        >
          <Button
            variant="secondary"
            isDisabled={!anyActivationsSelected}
            aria-label={intl.formatMessage(
              sharedMessages.deleteActivationTitle
            )}
          >
            {intl.formatMessage(sharedMessages.delete)}
          </Button>
        </Link>
      </ToolbarItem>
    </ToolbarGroup>
  );

  return (
    <Fragment>
      <TopToolbar>
        <Title headingLevel={"h2"}>Rulebook activations</Title>
      </TopToolbar>
      <ActivationsTableContext.Provider
        value={{
          selectedActivations,
          setSelectedActivations
        }}
      >
        <PageSection>
          <TableToolbarView
            ouiaId={'activations-table'}
            rows={rows}
            columns={columns(intl, selectedAll, selectAllFunction)}
            fetchData={updateActivations}
            routes={routes}
            actionResolver={actionResolver}
            titlePlural={intl.formatMessage(sharedMessages.activations)}
            titleSingular={intl.formatMessage(sharedMessages.activation)}
            toolbarButtons={toolbarButtons}
            isLoading={isFetching || isFiltering}
            renderEmptyState={() => (
              <TableEmptyState
                title={intl.formatMessage(sharedMessages.noactivations)}
                Icon={PlusCircleIcon}
                PrimaryAction={() =>
                  filterValue !== '' ? (
                    <Button onClick={() => clearFilters()} variant="link">
                      {intl.formatMessage(sharedMessages.clearAllFilters)}
                    </Button>
                  ) : (
                    <Link
                      id="create-activation-link"
                      to={{pathname: '/new-activation'}}
                    >
                      <Button
                        ouiaId={'create-activation-link'}
                        variant="primary"
                        aria-label={intl.formatMessage(
                          sharedMessages.addActivation
                        )}
                      >
                        {intl.formatMessage(sharedMessages.addActivation)}
                      </Button>
                    </Link>
                  )
                }
                description={
                  filterValue === ''
                    ? intl.formatMessage(sharedMessages.noactivations)
                    : intl.formatMessage(
                    sharedMessages.clearAllFiltersDescription
                    )
                }
                isSearch={!isEmpty(filterValue)}
              />
            )}
            activeFiltersConfig={{
              filters: prepareChips(filterValue, intl),
              onDelete: () => handleFilterChange('')
            }}
          />
        </PageSection>
      </ActivationsTableContext.Provider>
    </Fragment>
  );
}
export { Activations };
