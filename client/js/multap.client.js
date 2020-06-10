const homeComponents = []
const authComponents = []

var token = null

async function api(path, data, t) {
	t = t || token
	const res = await fetch(`{{base}}${path}`, {
		method: "post",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			token: t,
			...data,
		}),
	})
	if (!res.ok) {
		return {
			content: null,
			error: "Network error",
		}
	}
	const content = await res.json()
	if (content.error) {
		return {
			content: null,
			error: content.error,
		}
	}
	return {
		content: content,
		error: null,
	}
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
		room: null,
	}

	onLogin = async t => {
		const { content, error } = await api("auth/token", {}, t)
		if (error) {
			alert(error)
			return
		}
		console.log(content)
		token = t
		this.setState({ user: content.user })
		route("{{base}}rooms", true)
	}

	onLogout = () => {
		token = null
		this.setState({ user: null })
	}

	onJoinRoom = (room) => {
		this.setState({ room })
	}

	onLeaveRoom = (room) => {
		this.setState({ room: null })
	}

	handleRoute = (e) => {
		switch (e.url) {
			case '{{base}}':
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
					<${RoomsPage} onJoinRoom=${this.onJoinRoom} path="/rooms" />
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
			<div class="columns is-desktop">
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
			<p class="title"> {{name}} </p>
			<p> {{{descHTML}}} </p>
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
					<${RoomList} />
					<${RoomsControls} />
				</div>
			</div>
		`
	}
}

class RoomList extends Component {
	state = {
		rooms: [],
		isLoaded: false,
	}

	componentDidMount() {
		this.getRooms()
	}

	getRooms = async () => {
		const { content, error } = await api("rooms/get")
		if (error) {
			alert(error)
			return
		}
		this.setState({
			rooms: content.rooms,
			isLoaded: true,
		})
	}

	render(props, state) {
		var roomItems = []
		for (var room of this.state.rooms) {
			roomItems.push(html`
				<${RoomItem} room=${room}/>
			`)
		}

		return html`
			<div class="roomlist">
				<div class="columns">
					<div class="column is-narrow">
						<button class="button" onClick=${this.getRooms}>↻</button>
					</div>
					<div class="column">
						<input type="text" placeholder="Search..." />
					</div>
				</div>
				<div class="roomlist-container-header">
					<div class="columns">
						<div class="column is-4 is-offset-1"> Name </div>
						<div class="column is-4"> Host </div>
						<div class="column is-2 has-text-right"> # </div>
					</div>
				</div>
				<div class="roomlist-container">
					${roomItems}
					${this.state.isLoaded && roomItems.length == 0 && html`
						<div class="roomlist-item roomlist-item_norooms">
							No rooms
						</div>
					`}
					${!this.state.isLoaded && html`<div class="loader centered"></div> `}
				</div>
			</div>
			`
	}
}

class RoomItem extends Component {
	render(props) {
		console.log(props.room)
		return html`
			<div class="roomlist-item">
				<div class="columns">
					<div class="column is-1 roomlist-name">  </div>
					<div class="column is-4 roomlist-name"> ${props.room.name} </div>
					<div class="column is-4 roomlist-host"> ${props.room.host.nick} </div>
					<div class="column is-2 roomlist-count has-text-right"> ${props.room.num} / ${props.room.max} </div>
				</div>
			</div>
		`
	}
}

class RoomsControls extends Component {
	render(props) {
		return html`
			<div class="columns">
				<div class="column is-narrow">
					<${NewRoomButton} />
				</div>
				<div class="column is-narrow">
					<${FindRoomButton} />
				</div>
			</div>
		`
	}
}

class NewRoomButton extends Component {
	state = {
		open: false,
	}

	onClick = () => {
		this.setState({ open: true })
	}

	onClose = () => {
		this.setState({ open: false })
	}

	render(props) {
		return html`
			<button class="button" onClick=${this.onClick}>New Room</button>
			${this.state.open && html`
				<${Modal} onClose=${this.onClose}>
					<${NewRoomModal} />
				<//>
			`}
		`
	}
}

class NewRoomModal extends Component {
	state = {
		isLoaded: false,
		roomOptions: null,
	}

	onLoad = async () => {
		var { roomOptions, error } = await api("rooms/options")
		if (error) {
			alert(error)
			return
		}
		this.setState({isLoaded: true, roomOptions})
	}

	onClick = async () => {
		var { content, error } = await api("rooms/new", {


		})
		if (error) {
			alert(error)
			return
		}
		console.log(content)
	}

	render(props) {
		var formComponents = []

		this.onLoad()

		return html`
			${!this.state.isLoaded && html`<div class="loader"></div>`}
			${this.state.isLoaded && formComponents}
			<div class="field">
				<button onClick=${this.onClick}></button>
			</div>
		`
	}
}

class FindRoomButton extends Component {
	render(props) {
		return html`
			<button class="button">Find Room</button>
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

class Modal extends Component {
	render(props) {
		return createPortal(html`
			<div class="modal">
				<div class="modal-item">
					<div class="card">
						<div class="card-body">
							<button onClick=${props.onClose}> X </button>
							${props.children}
						</div>
					</div>
				</div>
			</div>
		`, document.body)
	}
}

class FormComponent extends Component {
	render(props) {
		viewname = props.viewname || props.name || "Form Field"
		name = props.name || "Form Field"

		return html`
			<div class="field">
				<label class="label"> ${name} </label>
				${props.children}
			</div>
		`
	}
}

homeComponents.push(HomeInfo)
