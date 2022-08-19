import React, { useEffect, useState } from 'react';
import variables from 'src/utils/variables';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import './index.scss';
import Cards from './Cards';
import ProposalDialog from './ProposalDialog';
import { fetchProposalTally, fetchVoteDetails, getProposals } from 'src/actions/proposals';
import UnSuccessDialog from '../Stake/DelegateDialog/UnSuccessDialog';
import PendingDialog from '../Stake/DelegateDialog/PendingDialog';
import SuccessDialog from '../Stake/DelegateDialog/SuccessDialog';
import { InsyncWrapper } from 'src/components/insync/InsyncWrapper';

const Proposals = props => {
	const [active, setActive] = useState(1);
	const [filter, setFilter] = useState(null);

	const getProposalDetails = data => {
		if (data && data.length && data[0]) {
			props.fetchProposalDetails(data[0], res => {
				if (data[1]) {
					data.splice(0, 1);
					getProposalDetails(data);
				}
			});
		}
	};

	const handleChange = value => {
		if (active === value) {
			return;
		}

		setActive(value);
		setFilter(value === null ? 2 : value === 2 ? 3 : value === 3 ? 2 : value === 4 ? 4 : null);
	};
	const filteredProposals = filter ? props.proposals.filter(item => item.status === filter) : props.proposals;

	const fetchProposals = () => {
		if (props.proposals && !props.proposals.length && !props.proposalsInProgress) {
			props.getProposals(result => {
				if (result && result.length) {
					const array = [];
					result.map(val => {
						const filter =
							props.proposalDetails &&
							Object.keys(props.proposalDetails).length &&
							Object.keys(props.proposalDetails).find(key => key === val.id);
						if (!filter) {
							if (val.status !== 2) {
								return null;
							}

							array.push(val.id);
						}
						if (val.status === 2) {
							props.fetchProposalTally(val.id);
						}

						return null;
					});
					getProposalDetails(array && array.reverse());
				}
			});
		}
	};

	useEffect(() => {
		fetchProposals();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<InsyncWrapper>
			<div className="proposals">
				{!props.open ? (
					<div className="proposals_content padding">
						<div className="heading">
							<div className="tabs">
								<p className={active === 1 ? 'active' : ''} onClick={() => handleChange(1)}>
									{variables[props.lang].all}
								</p>
								<span />
								<p className={active === 2 ? 'active' : ''} onClick={() => handleChange(2)}>
									{variables[props.lang].active}
								</p>
								<span />
								<p className={active === 3 ? 'active' : ''} onClick={() => handleChange(3)}>
									{variables[props.lang].pending}
								</p>
								<span />
								<p className={active === 4 ? 'active' : ''} onClick={() => handleChange(4)}>
									{variables[props.lang].closed}
								</p>
							</div>
						</div>
						{props.proposalsInProgress || props.voteDetailsInProgress ? (
							<div className="cards_content">Loading...</div>
						) : filteredProposals && filteredProposals.length ? (
							<Cards proposals={filteredProposals} />
						) : (
							<div className="cards_content">No data found</div>
						)}
					</div>
				) : (
					<ProposalDialog />
				)}
				<UnSuccessDialog />
				<PendingDialog />
				<SuccessDialog />
			</div>
		</InsyncWrapper>
	);
};

Proposals.propTypes = {
	fetchProposalTally: PropTypes.func.isRequired,
	fetchVoteDetails: PropTypes.func.isRequired,
	getProposals: PropTypes.func.isRequired,
	history: PropTypes.shape({
		push: PropTypes.func.isRequired,
	}).isRequired,
	lang: PropTypes.string.isRequired,
	open: PropTypes.bool.isRequired,
	proposals: PropTypes.array.isRequired,
	voteDetails: PropTypes.array.isRequired,
	voteDetailsInProgress: PropTypes.bool.isRequired,
	proposalsInProgress: PropTypes.bool,
};

const stateToProps = state => {
	return {
		proposals: state.proposals._.list,
		proposalsInProgress: state.proposals._.inProgress,
		lang: state.language,
		open: state.proposals.dialog.open,
		voteDetails: state.proposals.voteDetails.value,
		voteDetailsInProgress: state.proposals.voteDetails.inProgress,
	};
};

const actionsToProps = {
	getProposals,
	fetchVoteDetails,
	fetchProposalTally,
};

export default withRouter(connect(stateToProps, actionsToProps)(Proposals));
