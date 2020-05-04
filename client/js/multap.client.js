const homeComponents = []
const authComponents = []

const token = null

function api(path, data, t) {
	let token = t || token
	const res = await fetch(`{{base}}${path}`, {
		method: "post",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			token,
			...data,
		}),
	})
	if (!res.ok) {
		return null, "Network error"
	}
	const content = await res.json()
	if (content.error) {
		return null, content.error
	}
	return content, null
}

class Client extends Component {
	render() {
		return html`
		<${Wrapper}>
			<${MultapClient} />
		<//>`
	}
}

class Wrapper extends Component {
	render(props) {
		return html`
		<section class="section is-fullheight has-centered has-bg-light">
			${props.children}
		</section>
		`
	}
}

class MultapClient extends Component {
	state = {
		user: null,
	}

	onLogin = async t => {
		api("auth/token", {}, t)
		this.setState({ user: content.user, })
		route("{{base}}rooms", true)
	}

	onLogout = () => {
		token = null
		this.setState({ user: null })
	}

	handleRoute = async e => {
		switch (e.url) {
			case '/':
				if (this.state.user) route("{{base}}rooms", true)
				break
			default:
				if (!this.state.user) route("{{base}}", true)
				break
		}
	}

	render() {
		return html`
			<div class="container">
				<${Router} onChange=${this.handleRoute}>
					<${HomePage} onLogin=${this.onLogin} path="/" />
					<${RoomsPage} path="/rooms" />
					<${RoomPage} path="/room/:id" />
				<//>
				<${Footer} />
			</div>
		`
	}
}

class HomePage extends Component {
	authComponents = []
	homeComponents = []

	constructor(props) {
		super(props)

		for (var comp of authComponents) this.authComponents.push(html`
			<${comp} onLogin=${props.onLogin} />
		`)
		for (var comp of homeComponents) this.homeComponents.push(html`
			<${comp} />
		`)
	}

	render(props) {
		return html`
			<div class="columns">
				<div class="column is-8">
					${this.homeComponents}
				</div>
				<div class="column is-4">
					${this.authComponents}
				</div>
			</div>
		`
	}
}

class HomeInfo extends Component {
	render() {
		return html`
			<div class="card">
				<div class="card-header">
					<p> {{name}} </p>
				</div>
				<div class="card-body">
					{{{descHTML}}}
				</div>
			</div>
		`
	}
}

class Footer extends Component {
	render() {
		return html`
			<p class="has-text-small has-text-centered">
				Powered by <a href="https://github.com/yjp20/multap">Multap</a>
			</p>
		`
	}
}

class RoomsPage extends Component {
	render() {
		return html`
			<div class="card">
				<div class="card-header">
					<p> {{name}} - Rooms </p>
				</div>
				<div class="card-body">
					<${RoomList}>
					<//>
				</div>
			</div>
		`
	}
}

class RoomList extends Component {
	state = {
		rooms: []
		isLoaded: false,
	}

	getRooms = () => {
		const res = await fetch("{{base}}rooms", {
			method: "post",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				token,
			}),
		})
		if (!res.ok) {

		}
	}

	render(props, state) {
		roomItems = []
		for (room of this.state.rooms) {
			roomItems.push(html`
				<RoomItem Name=${room.name} Host=${room.host}}/>
			`)
		}
		return html`
			<div class="roomlist">
				${roomItems}
			</div>
		`
	}
}

class RoomItem extends Component {
	render() {
		return html`
			
		`
	}

}


class RoomPage extends Component {
	state = {
		id: null,
		title: null,
		token: null,
		isLoaded: false,
	}

	render(props, state) {
		return html`
			<div class="card">
				<div class="card-header">
					<p> {{name}} - Rooms </p>
				</div>
				<div class="card-body">
					${ !state.isLoaded && html`
						<div class="flex-column has-centered">
							<div class="loader"></div>
						</div>
					`}
					${ state.isLoaded }
				</div>
			</div>
		`
	}
}

homeComponents.push(HomeInfo)
