import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, FunctionComponent } from 'react';
import { useStore } from 'src/stores';
import { useActions } from 'src/hooks/useActions';
import * as accounts from '../../actions/accounts';
import * as stake from '../../actions/stake';
import { config } from '../../config-insync';
import SnackbarMessage from './SnackbarMessage';
import { useShallowEqualSelector } from 'src/hooks/useShallowEqualSelector';

export const InsyncWrapper: FunctionComponent = observer(({ children }) => {
	const { chainStore, accountStore } = useStore();
	const account = accountStore.getAccount(chainStore.current.chainId);

	const props = useShallowEqualSelector(state => ({
		balance: state.accounts.balance.result,
		balanceInProgress: state.accounts.balance.inProgress,
		delegations: state.accounts.delegations.result,
		delegationsInProgress: state.accounts.delegations.inProgress,
		delegatedValidatorList: state.stake.delegatedValidators.list,
		delegatedValidatorListInProgress: state.stake.delegatedValidators.inProgress,
		unBondingDelegations: state.accounts.unBondingDelegations.result,
		unBondingDelegationsInProgress: state.accounts.unBondingDelegations.inProgress,
		validatorImages: (state.stake.validators as any).images,
		validatorList: (state.stake.validators as any).list,
		validatorListInProgress: (state.stake.validators as any).inProgress,
		vestingBalance: state.accounts.vestingBalance.result,
		vestingBalanceInProgress: state.accounts.vestingBalance.inProgress,
	}));
	const propsRef = useRef(props);
	propsRef.current = props;

	const [
		setAccountAddress,
		getDelegations,
		getBalance,
		getUnBondingDelegations,
		fetchRewards,
		fetchVestingBalance,
		getDelegatedValidatorsDetails,
		getValidators,
		fetchValidatorImage,
		fetchValidatorImageSuccess,
	] = useActions([
		accounts.setAccountAddress,
		accounts.getDelegations,
		accounts.getBalance,
		accounts.getUnBondingDelegations,
		accounts.fetchRewards,
		accounts.fetchVestingBalance,
		stake.getDelegatedValidatorsDetails,
		stake.getValidators,
		stake.fetchValidatorImage,
		stake.fetchValidatorImageSuccess,
	]);

	const address = account.bech32Address;

	const getValidatorImage = useCallback(
		(index: number, data: Array<any>) => {
			const array = [];
			for (let i = 0; i < 3; i++) {
				if (data[index + i]) {
					const value = data[index + i];
					let list = sessionStorage.getItem(`${config.PREFIX}_images`) || '{}';
					list = JSON.parse(list);
					if (value && value.description && value.description.identity && !list[value.description.identity]) {
						array.push(fetchValidatorImage(value.description.identity));
					} else if (value && value.description && value.description.identity && list[value.description.identity]) {
						fetchValidatorImageSuccess({
							...(list[value.description.identity] as any),
							_id: value.description.identity,
						});
					}
				} else {
					break;
				}
			}

			Promise.all(array).then(() => {
				if (index + 3 < data.length - 1) {
					getValidatorImage(index + 3, data);
				}
			});
		},
		[fetchValidatorImage, fetchValidatorImageSuccess]
	);

	const fetch = useCallback(
		address => {
			if (!address) {
				return;
			}

			if (propsRef.current.balance && !propsRef.current.balance.length && !propsRef.current.balanceInProgress) {
				getBalance(address);
			}
			if (
				propsRef.current.vestingBalance &&
				!propsRef.current.vestingBalance.value &&
				!propsRef.current.vestingBalanceInProgress
			) {
				fetchVestingBalance(address);
			}

			if (!propsRef.current.proposalTab) {
				fetchRewards(address);
			}

			if (
				propsRef.current.unBondingDelegations &&
				!propsRef.current.unBondingDelegations.length &&
				!propsRef.current.unBondingDelegationsInProgress &&
				!propsRef.current.proposalTab
			) {
				getUnBondingDelegations(address);
			}
			if (
				propsRef.current.delegations &&
				!propsRef.current.delegations.length &&
				!propsRef.current.delegationsInProgress &&
				!propsRef.current.proposalTab
			) {
				getDelegations(address);
			}
			if (
				propsRef.current.delegatedValidatorList &&
				!propsRef.current.delegatedValidatorList.length &&
				!propsRef.current.delegatedValidatorListInProgress &&
				!propsRef.current.proposalTab
			) {
				getDelegatedValidatorsDetails(address);
			}

			if (
				!propsRef.current.validatorList.length &&
				!propsRef.current.validatorListInProgress &&
				!propsRef.current.proposalTab
			) {
				getValidators((data: Array<any>) => {
					if (
						data &&
						data.length &&
						propsRef.current.validatorImages &&
						propsRef.current.validatorImages.length === 0
					) {
						const array = data.filter((val: any) => val && val.description && val.description.identity);
						getValidatorImage(0, array);
					}
				});
			}
		},
		[
			fetchRewards,
			fetchVestingBalance,
			getBalance,
			getDelegatedValidatorsDetails,
			getDelegations,
			getUnBondingDelegations,
			getValidatorImage,
			getValidators,
		]
	);

	useEffect(() => {
		setAccountAddress(address);
	}, [setAccountAddress, address]);

	useEffect(() => {
		document.body.classList.add('insync');
		return () => document.body.classList.remove('insync');
	}, []);

	useEffect(() => {
		const callback = () => {
			if (address) {
				fetch(address);
			}
		};
		window.addEventListener('keplr_keystorechange', callback);
		return () => window.removeEventListener('keplr_keystorechange', callback);
	}, [address, fetch]);

	useEffect(() => {
		fetch(address);
	}, [address, fetch]);

	return (
		<div className="of_community">
			{children}
			<SnackbarMessage />
		</div>
	);
});