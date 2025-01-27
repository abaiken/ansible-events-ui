import { PageSection, Title } from '@patternfly/react-core';
import { useHistory } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody as PFCardBody,
  SimpleList as PFSimpleList,
} from '@patternfly/react-core';
import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core';
import { postData } from '@app/utils/utils';
import {getServer} from '@app/utils/utils';

import styled from 'styled-components';
import {TopToolbar} from "@app/shared/top-toolbar";


const CardBody = styled(PFCardBody)`
  white-space: pre-wrap;
  `
const SimpleList = styled(PFSimpleList)`
  white-space: pre-wrap;
`

const endpoint = 'http://' + getServer() + '/api/project/';

const NewProject: React.FunctionComponent = () => {

  const history = useHistory();

  const [value, setValue] = useState('');

  const handleSubmit = () => {
      console.log('submit ' + value);
			postData(endpoint, { url: value })
				.then(data => {
					console.log(data);
          history.push("/project/" + data.id);
			});
  };

  return (
  <React.Fragment>
    <TopToolbar
      breadcrumbs={[
        {
          title: 'Projects',
          to: '/projects'
        }
        ]
      }>
      <Title headingLevel={"h2"}>New project</Title>
    </TopToolbar>
    <PageSection>
      <Card>
        <CardBody>
        <Form isWidthLimited>
          <FormGroup
            label="Git URL"
            fieldId="url-1"
          >
            <TextInput
              onChange={setValue}
              value={value}
              id="url-1"
            />
          </FormGroup>
          <ActionGroup>
            <Button variant="primary" onClick={handleSubmit}>Save</Button>
            <Button variant="link" onClick={() => history.push('/projects')}> Cancel</Button>
          </ActionGroup>
        </Form>
        </CardBody>
      </Card>
    </PageSection>
  </React.Fragment>
)
}

export { NewProject };
