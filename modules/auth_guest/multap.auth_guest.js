class AuthGuest extends Component {
	state = {
		nick: null,
		loading: false,
	}

	constructor(props) {
		super(props)

		this.onLogin = props.onLogin
	}

	onSubmit = async e => {
		e.preventDefault()
		this.setState({
			loading: true,
		})
		const res = await fetch('/auth/guest', {
			method: "post",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				nick: this.state.nick,
			}),
		})
		if (!res.ok) {
			alert("error")
			this.setState({
				loading: false,
			})
			return
		}
		const content = await res.json()
		if (!content.token) {
			alert("error")
			this.setState({
				loading: false,
			})
			return
		}
		await this.onLogin(content.token)
	}

	onInput = e => {
		const { value } = e.target
		this.setState({ nick: value })
	}

	render(props) {
		return html`
			<div class="card">
				<div class="card-header">
					Guest Login
				</div>
				<div class="card-body">
					<form onSubmit=${this.onSubmit}>
						<div class="field">
							<div class="control">
								<input type="text" placeholder="Nickname" onInput=${this.onInput}/>
								<button class="button is-dark"> Guest </button>
							</div>
						</div>
						${ this.state.loading && html`
							<div class="loader centered"></div>
						`}
					</form>
				</div>
			</div>
		`
	}
}

authComponents.push(AuthGuest)
