import React from 'react-native';
import Router from './Router';
import Route from './Route';
import * as Components from './Common';
import ExNavigator from '@exponent/react-native-navigator';
import ExNavigatorStyles from '@exponent/react-native-navigator/ExNavigatorStyles';
import { BackIcon } from '@exponent/react-native-navigator/ExNavigatorIcons';
import Animations from './Animations';
const {TouchableOpacity, Navigator, StyleSheet, View, Text} = React;
import ReactRouter from './ReactRouter';
import Actions from './Actions';
import debug from './debug';

export class ExRouteAdapter {
    name: string;
    navigator: ExNavigator;
    route: Route;
    props: { [key: string]: any};

    constructor(route: Route, props:{ [key: string]: any} = {}){
        if (!route){
            throw new Error("route is not defined ");
        }
        this.route = route;
        this.name = route.name;
        if (!this.name){
            throw new Error("name is not defined for route");
        }
        this.props = props;
        this.renderScene = this.renderScene.bind(this);
        if (this.route.props.renderRightButton){
            this.renderRightButton = this.route.props.renderRightButton.bind(this.route);
        }
        if (this.route.props.renderTitle){
            this.renderTitle = this.route.props.renderTitle.bind(this.route);
        }
        if (this.route.props.renderLeftButton){
            this.renderLeftButton = this.route.props.renderLeftButton.bind(this.route);
        }
    }

    configureScene() {
        return this.route.type === 'switch' ? Animations.None : this.route.props.sceneConfig || Animations.None;
    }

    renderScene(navigator) {
        debug("RENDER SCENE:"+ this.route.name + " TITLE:"+this.route.title);
        const Component = this.route.component;
        const child = Component ?
            !this.route.wrapRouter ? <Component key={this.route.name} name={this.route.name} {...this.route.props} {...this.props} route={this.route}/>:
                <ReactRouter name={this.route.name+"Router"} {...this.route.props} {...this.props} route={this.route} router={ExRouter}  initial={"_"+this.route.name} footer={null} header={null}>
                    <Components.Route {...this.route.props}  {...this.props} component={Component} name={"_"+this.route.name} type="push" wrapRouter={false} initial={true}/>
                </ReactRouter>
            :
            React.cloneElement(React.Children.only(this.route.children), {...this.route.props, data:this.props, route:this.route});

        const Header = this.route.props.header;
        const header = Header ? <Header {...this.route.props} {...this.props}/> : null;

        const Footer = this.route.props.footer;
        const footer = Footer ? <Footer {...this.route.props} {...this.props}/> : null;

        return (
            <View style={styles.transparent}>
                {header}
                {child}
                {footer}
            </View>
        );
    }

    getName(){
        return this.route.name;
    }

    getTitle() {
        debug("TITLE ="+this.route.title+" for route="+this.route.name);
        return this.route.title || "";
    }

    getBackButtonTitle(navigator, index, state){
        let previousIndex = index - 1;
        let previousRoute = state.routeStack[previousIndex];
        let title = previousRoute.getTitle(navigator, previousIndex, state);
        return title.length>10 ? null : title;
    }

    renderLeftButton(navigator, index, state){
        if (index === 0 || index < navigator.getCurrentRoutes().length-1) {
            return null;
        }

        let previousIndex = index - 1;
        let previousRoute = state.routeStack[previousIndex];
        if (previousRoute.renderBackButton) {
            return previousRoute.renderBackButton(navigator, previousIndex, state);
        }

        let title = this.getBackButtonTitle(navigator, index, state);

        if (title) {
            var buttonText =
                <Text
                    numberOfLines={1}
                    style={[
            ExNavigatorStyles.barButtonText,
            ExNavigatorStyles.barBackButtonText,
            this._barButtonTextStyle,
          ]}
                >
                    {title}
                </Text>;
        }

        return (
            <TouchableOpacity
                pressRetentionOffset={ExNavigatorStyles.barButtonPressRetentionOffset}
                onPress={() => Actions.pop()}
                style={[ExNavigatorStyles.barBackButton, styles.backButtonStyle]}>
                <BackIcon
                    style={[
            ExNavigatorStyles.barButtonIcon,
            this._barButtonIconStyle,
          ]}
                />
                {buttonText}
            </TouchableOpacity>
        );
    }

    renderRightButton(navigator, index, state) {
        if (this.route.props.onRight && this.route.props.rightTitle){
            return (<TouchableOpacity
                touchRetentionOffset={ExNavigator.Styles.barButtonTouchRetentionOffset}
                onPress={() => this.route.props.onRight({...this.route.props, ...this.props})}
                style={[ExNavigator.Styles.barRightButton, this.route.props.rightButtonStyle]}>
                <Text style={[ExNavigator.Styles.barRightButtonText, this.route.props.rightButtonTextStyle]}>{this.route.props.rightTitle}</Text>
            </TouchableOpacity>);
        } else {
            return null;
        }
    }
}

class ExNavigationBar extends Navigator.NavigationBar {
    constructor(props){
        super(props);
        this.state = {};
    }
    render(){
        const route = this.props.router.nextRoute || this.props.router.currentRoute;
        if (route.props.hideNavBar === false){
            return super.render();
        }
        if (this.props.router.props.hideNavBar){
            return null;
        }
        return super.render();
    }
}

export default class ExRouter extends React.Component {
    router: Router;

    constructor(props){
        super(props);
        this.onPop = this.onPop.bind(this);
        this.onPush = this.onPush.bind(this);
        this.onPop = this.onPop.bind(this);
        this.onPush = this.onPush.bind(this);
        this.onReset = this.onReset.bind(this);
        this.onReplace = this.onReplace.bind(this);
        this.onJump = this.onJump.bind(this);
    }

    onPush(route: Route, props:{ [key: string]: any}):boolean {
        if (this.props.onPush){
            const res = this.props.onPush(route, props);
            if (!res){
                return false;
            }
        }
        this.refs.nav.push(new ExRouteAdapter(route, props));
        debug("PUSHED TO:"+route.name);
        return true;
    }

    onReplace(route: Route, props:{ [key: string]: any}):boolean {
        if (this.props.onReplace){
            const res = this.props.onReplace(route, props);
            if (!res){
                return false;
            }
        }
        this.refs.nav.replace(new ExRouteAdapter(route, props));
        return true;
    }

    /***
     * Reset every scene with an array of routes
     * @param route defined route
     */

     onReset(route: Route, props:{ [key: string]: any}):boolean {
        if (this.props.onReset){
            const res = this.props.onReset(route, props);
            if (!res){
                return false;
            }
        }
        this.refs.nav.immediatelyResetRouteStack([new ExRouteAdapter(route, props)]);
        return true;
    }

    onJump(route: Route, props:{ [key: string]: any}):boolean {
        if (this.props.onJump){
            const res = this.props.onJump(route, props);
            if (!res){
                return false;
            }
        }
        const navigator = this.refs.nav;
        const routes = navigator.getCurrentRoutes();
        const exist = routes.filter(el=>el.getName()==route.name);
        if (exist.length){
            navigator.jumpTo(exist[0]);
        } else {
            navigator.push(new ExRouteAdapter(route, props));

        }
        this.setState({selected: route.name});
        return true;
    }

    onPop(num: number){
        if (this.props.onPop){
            const res = this.props.onPop(num);
            if (!res){
                return false;
            }
        }
        this.refs.nav.pop();
        return true;
    }

    render() {
        const router = this.props.router;
        if (!router){
            throw new Error("No router is defined");
        }
        const Header = this.props.header;
        const header = Header ? <Header {...this.props} {...this.state}/> : null;

        const Footer = this.props.footer;
        const footer = Footer ? <Footer {...this.props} {...this.state}/> : null;
        debug("RENDER ROUTER:",router.name);
        debug(Object.keys(router.routes));
        debug(router.stack);

        // var navigationStyles = React.Platform.OS === 'android' ?
          // Navigator.NavigationBar.StylesAndroid : Navigator.NavigationBar.StylesIOS;
        var self =this;
        return (
            <View style={styles.transparent}>
                {header}
                <ExNavigator ref="nav" initialRouteStack={router.stack.map(route => new ExRouteAdapter(router.routes[route]))}
                         style={styles.transparent}
                         sceneStyle={{ paddingTop: 0 }}
                         renderNavigationBar={props=><ExNavigationBar {...props} router={router} navigationStyles={self.props.navigationStyles ? self.props.navigationStyles: undefined}/>}
                    {...this.props}
                />
                {footer}
            </View>
        );
    }


}


var styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top:0,
        bottom:0,
        left:0,
        right:0,
        backgroundColor:'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    transparent: {
        flex:1,
        backgroundColor: "transparent"
    },
    barTitleText: {
        fontFamily: '.HelveticaNeueInterface-MediumP4',
        fontSize: 17,
        marginTop: 11,
    },

});

